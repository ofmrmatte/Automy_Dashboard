import { createHash, randomBytes } from "node:crypto";
import type { QueryResultRow } from "pg";
import { getAutomyAuth } from "@/features/identity/server/better-auth";
import { sendPortalInvitationEmail } from "@/features/email/transactional-email";
import { getRailwayPostgresPool } from "@/shared/server/postgres";

type QueryableConnection = {
  query: <T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

type PortalProvisioningContext = {
  companyId: string;
  authUserId: string;
  domainUserId?: string | null;
};

type ContractProvisioningRow = {
  id: string;
  company_id: string;
  client_id: string;
  portal_access_enabled: boolean;
  portal_contact_name: string | null;
  portal_contact_email: string | null;
  signer_name: string | null;
  signer_email: string | null;
  client_name: string;
};

type AuthUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type PortalUserRow = {
  id: string;
  auth_user_id: string;
  client_id: string;
  status: string;
};

type ProvisioningRow = {
  id: string;
  portal_user_id: string | null;
  status: string;
};

type PortalAccessRow = {
  id: string;
  portal_user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  activated_at: string | null;
  provisioning_status: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

const INVITATION_TTL_HOURS = 48;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function portalPublicOrigin() {
  const configured = process.env["PORTAL_PUBLIC_ORIGIN"]?.trim();
  if (configured) return new URL(configured).origin;
  return process.env["NODE_ENV"] === "production"
    ? "https://cliente.automy.dev.br"
    : "http://localhost:4175";
}

function activationUrl(token: string) {
  const url = new URL("/ativar-conta", portalPublicOrigin());
  url.searchParams.set("token", token);
  return url.toString();
}

async function recordPortalProvisioningAudit(
  db: QueryableConnection,
  context: PortalProvisioningContext,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await db.query(
    `
      insert into public.audit_logs (
        company_id,
        actor_auth_user_id,
        actor_user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, $3::uuid, $4, $5, $6::uuid, $7, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId ?? null,
      action,
      resourceType,
      resourceId,
      JSON.stringify(metadata),
    ],
  );
}

async function loadContractForProvisioning(
  db: QueryableConnection,
  context: PortalProvisioningContext,
  contractId: string,
) {
  const result = await db.query<ContractProvisioningRow>(
    `
      select
        contracts.id,
        contracts.company_id,
        contracts.client_id,
        contracts.portal_access_enabled,
        contracts.portal_contact_name,
        contracts.portal_contact_email,
        contracts.signer_name,
        contracts.signer_email,
        coalesce(clients.trade_name, clients.legal_name) as client_name
      from public.contracts
      join public.clients
        on clients.id = contracts.client_id
        and clients.company_id = contracts.company_id
        and clients.deleted_at is null
      where contracts.id = $2
        and contracts.company_id = $1
        and contracts.deleted_at is null
      limit 1
    `,
    [context.companyId, contractId],
  );

  return result.rows[0] ?? null;
}

async function findAuthUserByEmail(db: QueryableConnection, email: string) {
  const result = await db.query<AuthUserRow>(
    `
      select id, name, email, role
      from public."user"
      where lower(email) = lower($1)
        and deleted_at is null
      limit 1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}

async function findPortalUserByAuthUser(db: QueryableConnection, authUserId: string) {
  const result = await db.query<PortalUserRow>(
    `
      select id, auth_user_id, client_id, status
      from public.client_portal_users
      where auth_user_id = $1
        and deleted_at is null
      limit 1
    `,
    [authUserId],
  );
  return result.rows[0] ?? null;
}

async function isInternalUser(db: QueryableConnection, authUserId: string) {
  const result = await db.query<{ id: string }>(
    `
      select id
      from public.users
      where auth_user_id = $1
        and deleted_at is null
      limit 1
    `,
    [authUserId],
  );
  return Boolean(result.rows[0]);
}

async function markProvisioningConflict(
  db: QueryableConnection,
  context: PortalProvisioningContext,
  contract: ContractProvisioningRow,
  contactName: string,
  contactEmail: string,
  reason: string,
) {
  const result = await db.query<ProvisioningRow>(
    `
      insert into public.client_portal_provisioning (
        company_id, client_id, contract_id, contact_name, contact_email, status,
        failed_at, failure_reason, created_by, updated_by
      )
      values ($1, $2, $3, $4, $5, 'conflict', now(), $6, $7, $7)
      on conflict (company_id, contract_id) where deleted_at is null
      do update set
        contact_name = excluded.contact_name,
        contact_email = excluded.contact_email,
        status = 'conflict',
        failed_at = now(),
        failure_reason = excluded.failure_reason,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning id, portal_user_id, status
    `,
    [
      contract.company_id,
      contract.client_id,
      contract.id,
      contactName,
      contactEmail,
      reason,
      context.authUserId,
    ],
  );

  await recordPortalProvisioningAudit(
    db,
    context,
    "portal.provisioning.failed",
    "contract",
    contract.id,
    { reason },
  );

  return {
    status: "conflict",
    provisioningId: result.rows[0]?.id ?? null,
    error: reason,
  };
}

async function upsertBetterAuthResetToken(
  db: QueryableConnection,
  authUserId: string,
  token: string,
  expiresAt: Date,
) {
  await db.query(
    `delete from public.verification where identifier like 'reset-password:%' and value = $1`,
    [authUserId],
  );
  await db.query(
    `
      insert into public.verification (identifier, value, "expiresAt", "createdAt", "updatedAt")
      values ($1, $2, $3, now(), now())
    `,
    [`reset-password:${token}`, authUserId, expiresAt],
  );
}

async function createOrReusePortalUser(
  db: QueryableConnection,
  context: PortalProvisioningContext,
  contract: ContractProvisioningRow,
  contactName: string,
  contactEmail: string,
) {
  const existingAuth = await findAuthUserByEmail(db, contactEmail);
  let authUserId = existingAuth?.id ?? null;
  let accountCreated = false;

  if (authUserId && (await isInternalUser(db, authUserId))) {
    return markProvisioningConflict(
      db,
      context,
      contract,
      contactName,
      contactEmail,
      "E-mail pertence a um usuário interno do ERP.",
    );
  }

  if (existingAuth && !["customer", "read_only"].includes(existingAuth.role)) {
    return markProvisioningConflict(
      db,
      context,
      contract,
      contactName,
      contactEmail,
      "E-mail pertence a uma conta Better Auth administrativa.",
    );
  }

  if (authUserId) {
    const existingPortal = await findPortalUserByAuthUser(db, authUserId);
    if (existingPortal && existingPortal.client_id !== contract.client_id) {
      return markProvisioningConflict(
        db,
        context,
        contract,
        contactName,
        contactEmail,
        "E-mail ja esta vinculado a outro cliente do Portal.",
      );
    }
  }

  if (!authUserId) {
    const createdAuth = await db.query<{ id: string }>(
      `
        insert into public."user" (
          name, email, "emailVerified", image, role, status, "createdAt", "updatedAt"
        )
        values ($1, $2, false, null, 'customer', 'invited', now(), now())
        returning id
      `,
      [contactName, contactEmail],
    );
    authUserId = createdAuth.rows[0]?.id ?? null;
    accountCreated = true;
  } else {
    await db.query(
      `
        update public."user"
        set name = coalesce(nullif($2, ''), name),
            role = case when role = 'customer' then role else role end,
            status = case when status = 'active' then status else 'invited' end,
            "updatedAt" = now()
        where id = $1
      `,
      [authUserId, contactName],
    );
  }

  if (!authUserId) throw new Error("Nao foi possivel criar ou localizar a conta Better Auth.");

  const portalResult = await db.query<{ id: string }>(
    `
      insert into public.client_portal_users (
        company_id, client_id, auth_user_id, name, email, role, status,
        invited_at, created_by, updated_by
      )
      values ($1, $2, $3, $4, $5, 'customer_admin', 'invited', now(), $6, $6)
      on conflict (auth_user_id)
      do update set
        name = excluded.name,
        email = excluded.email,
        status = case
          when client_portal_users.status = 'active' then 'active'
          else 'invited'
        end,
        updated_by = excluded.updated_by,
        updated_at = now()
      where client_portal_users.client_id = excluded.client_id
        and client_portal_users.company_id = excluded.company_id
      returning id
    `,
    [
      contract.company_id,
      contract.client_id,
      authUserId,
      contactName,
      contactEmail,
      context.authUserId,
    ],
  );

  const portalUserId = portalResult.rows[0]?.id;
  if (!portalUserId) {
    return markProvisioningConflict(
      db,
      context,
      contract,
      contactName,
      contactEmail,
      "Nao foi possivel vincular o usuario ao cliente sem risco de conflito.",
    );
  }

  return { status: "ok", authUserId, portalUserId, accountCreated };
}

async function prepareInvitation(
  db: QueryableConnection,
  context: PortalProvisioningContext,
  contract: ContractProvisioningRow,
  portalUserId: string,
  contactName: string,
  contactEmail: string,
  accountCreated: boolean,
) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);
  const hash = tokenHash(token);

  const authUser = await db.query<{ auth_user_id: string }>(
    `select auth_user_id from public.client_portal_users where id = $1 and deleted_at is null`,
    [portalUserId],
  );
  const authUserId = authUser.rows[0]?.auth_user_id;
  if (!authUserId) throw new Error("Usuario do Portal nao encontrado para convite.");

  await upsertBetterAuthResetToken(db, authUserId, token, expiresAt);

  const provisioning = await db.query<ProvisioningRow>(
    `
      insert into public.client_portal_provisioning (
        company_id, client_id, contract_id, portal_user_id, contact_name, contact_email,
        status, activation_token_hash, invitation_expires_at, account_created_at,
        invitation_created_at, requested_at, created_by, updated_by
      )
      values (
        $1, $2, $3, $4, $5, $6, 'delivery_pending', $7, $8,
        case when $9 then now() else null end, now(), now(), $10, $10
      )
      on conflict (company_id, contract_id) where deleted_at is null
      do update set
        portal_user_id = excluded.portal_user_id,
        contact_name = excluded.contact_name,
        contact_email = excluded.contact_email,
        status = 'delivery_pending',
        activation_token_hash = excluded.activation_token_hash,
        invitation_expires_at = excluded.invitation_expires_at,
        invitation_created_at = now(),
        failure_reason = null,
        failed_at = null,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning id, portal_user_id, status
    `,
    [
      contract.company_id,
      contract.client_id,
      contract.id,
      portalUserId,
      contactName,
      contactEmail,
      hash,
      expiresAt,
      accountCreated,
      context.authUserId,
    ],
  );

  await recordPortalProvisioningAudit(
    db,
    context,
    accountCreated ? "portal.account.created" : "portal.access.requested",
    "contract",
    contract.id,
    { provisioningId: provisioning.rows[0]?.id, clientId: contract.client_id },
  );
  await recordPortalProvisioningAudit(
    db,
    context,
    "portal.invitation.created",
    "contract",
    contract.id,
    { provisioningId: provisioning.rows[0]?.id, expiresAt: expiresAt.toISOString() },
  );

  return { provisioningId: provisioning.rows[0]?.id, token };
}

export async function processContractPortalProvisioning(
  contractId: string,
  context: PortalProvisioningContext,
) {
  const pool = await getRailwayPostgresPool();
  const client = await pool.connect();
  let invitation: {
    provisioningId: string | undefined;
    token: string;
    name: string;
    email: string;
    contractId: string;
  } | null = null;

  try {
    await client.query("begin");
    const contract = await loadContractForProvisioning(client, context, contractId);
    if (!contract) {
      await client.query("rollback");
      return { status: "not_found", error: "Contrato nao encontrado." };
    }

    if (!contract.portal_access_enabled) {
      const disabled = await client.query<ProvisioningRow>(
        `
          insert into public.client_portal_provisioning (
            company_id, client_id, contract_id, contact_name, contact_email, status,
            created_by, updated_by
          )
          values ($1, $2, $3, $4, $5, 'disabled', $6, $6)
          on conflict (company_id, contract_id) where deleted_at is null
          do update set status = 'disabled', updated_by = excluded.updated_by, updated_at = now()
          returning id, portal_user_id, status
        `,
        [
          contract.company_id,
          contract.client_id,
          contract.id,
          contract.portal_contact_name ?? contract.signer_name ?? contract.client_name,
          contract.portal_contact_email ?? contract.signer_email ?? "",
          context.authUserId,
        ],
      );
      await client.query("commit");
      return { status: "disabled", provisioningId: disabled.rows[0]?.id ?? null };
    }

    const contactName = (contract.portal_contact_name || contract.signer_name || "").trim();
    const contactEmail = normalizeEmail(
      contract.portal_contact_email || contract.signer_email || "",
    );
    if (contactName.length < 2 || !isValidEmail(contactEmail)) {
      const conflict = await markProvisioningConflict(
        client,
        context,
        contract,
        contactName || contract.client_name,
        contactEmail,
        "Nome ou e-mail de acesso ao Portal invalido.",
      );
      await client.query("commit");
      return conflict;
    }

    const portalUser = await createOrReusePortalUser(
      client,
      context,
      contract,
      contactName,
      contactEmail,
    );
    if (portalUser.status !== "ok") {
      await client.query("commit");
      return portalUser;
    }

    const prepared = await prepareInvitation(
      client,
      context,
      contract,
      portalUser.portalUserId,
      contactName,
      contactEmail,
      portalUser.accountCreated,
    );
    invitation = {
      provisioningId: prepared.provisioningId,
      token: prepared.token,
      name: contactName,
      email: contactEmail,
      contractId: contract.id,
    };
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  if (!invitation?.provisioningId) {
    return { status: "delivery_failed", error: "Provisionamento nao retornou convite." };
  }

  try {
    await sendPortalInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      activationUrl: activationUrl(invitation.token),
    });
    await pool.query(
      `
        update public.client_portal_provisioning
        set status = 'sent', sent_at = now(), failure_reason = null, failed_at = null, updated_at = now()
        where id = $1
      `,
      [invitation.provisioningId],
    );
    await recordPortalProvisioningAudit(
      pool,
      context,
      "portal.invitation.sent",
      "contract",
      invitation.contractId,
      {
        provisioningId: invitation.provisioningId,
      },
    );
    return { status: "sent", provisioningId: invitation.provisioningId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar convite.";
    await pool.query(
      `
        update public.client_portal_provisioning
        set status = 'delivery_failed', failed_at = now(), failure_reason = $2, updated_at = now()
        where id = $1
      `,
      [invitation.provisioningId, message],
    );
    await recordPortalProvisioningAudit(
      pool,
      context,
      "portal.provisioning.failed",
      "contract",
      invitation.contractId,
      { provisioningId: invitation.provisioningId, reason: "delivery_failed" },
    );
    return { status: "delivery_failed", provisioningId: invitation.provisioningId, error: message };
  }
}

export async function listClientPortalAccesses(
  clientId: string,
  context: PortalProvisioningContext,
) {
  const pool = await getRailwayPostgresPool();
  const result = await pool.query<PortalAccessRow>(
    `
      select
        portal.id,
        portal.id as portal_user_id,
        portal.name,
        portal.email,
        portal.role,
        portal.status,
        auth_user.last_login,
        coalesce(portal.activated_at, latest_provisioning.activated_at) as activated_at,
        latest_provisioning.status as provisioning_status,
        latest_provisioning.sent_at,
        latest_provisioning.failed_at,
        latest_provisioning.failure_reason
      from public.client_portal_users portal
      join public."user" auth_user
        on auth_user.id = portal.auth_user_id
        and auth_user.deleted_at is null
      left join lateral (
        select status, sent_at, failed_at, failure_reason, activated_at
        from public.client_portal_provisioning provisioning
        where provisioning.portal_user_id = portal.id
          and provisioning.company_id = portal.company_id
          and provisioning.deleted_at is null
        order by provisioning.updated_at desc
        limit 1
      ) latest_provisioning on true
      where portal.company_id = $1
        and portal.client_id = $2
        and portal.deleted_at is null
      order by portal.created_at desc
    `,
    [context.companyId, clientId],
  );
  return result.rows;
}

export async function disableClientPortalAccess(
  portalUserId: string,
  context: PortalProvisioningContext,
) {
  const pool = await getRailwayPostgresPool();
  const result = await pool.query<{ id: string; auth_user_id: string; client_id: string }>(
    `
      update public.client_portal_users
      set status = 'inactive',
          updated_by = $3,
          updated_at = now()
      where id = $1
        and company_id = $2
        and deleted_at is null
      returning id, auth_user_id, client_id
    `,
    [portalUserId, context.companyId, context.authUserId],
  );
  const row = result.rows[0];
  if (!row) return { ok: false, error: "Acesso nao encontrado." };

  await pool.query(
    `update public."user" set status = 'inactive', "updatedAt" = now() where id = $1`,
    [row.auth_user_id],
  );
  await recordPortalProvisioningAudit(
    pool,
    context,
    "portal.access.disabled",
    "client",
    row.client_id,
    {
      portalUserId,
    },
  );
  return { ok: true };
}

export async function resendClientPortalInvitation(
  portalUserId: string,
  context: PortalProvisioningContext,
) {
  const pool = await getRailwayPostgresPool();
  const contractResult = await pool.query<{ contract_id: string }>(
    `
      select contract_id
      from public.client_portal_provisioning
      where portal_user_id = $1
        and company_id = $2
        and deleted_at is null
      order by updated_at desc
      limit 1
    `,
    [portalUserId, context.companyId],
  );
  const contractId = contractResult.rows[0]?.contract_id;
  if (!contractId) return { status: "not_found", error: "Convite anterior nao encontrado." };
  const result = await processContractPortalProvisioning(contractId, context);
  if (result.status === "sent") {
    await recordPortalProvisioningAudit(
      pool,
      context,
      "portal.invitation.regenerated",
      "contract",
      contractId,
      {
        portalUserId,
        provisioningId: result.provisioningId,
      },
    );
  }
  return result;
}

export async function verifyPortalActivationToken(token: string) {
  if (!token) return { status: "invalid" as const };
  const pool = await getRailwayPostgresPool();
  const result = await pool.query<{
    id: string;
    contact_name: string;
    contact_email: string;
    status: string;
    invitation_expires_at: string;
  }>(
    `
      select id, contact_name, contact_email, status, invitation_expires_at
      from public.client_portal_provisioning
      where activation_token_hash = $1
        and deleted_at is null
      order by updated_at desc
      limit 1
    `,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  if (!row) return { status: "invalid" as const };
  if (row.status === "activated") return { status: "used" as const };
  if (new Date(row.invitation_expires_at).getTime() < Date.now())
    return { status: "expired" as const };
  return { status: "valid" as const, name: row.contact_name, email: row.contact_email };
}

export async function activatePortalInvitation(token: string, password: string) {
  const verification = await verifyPortalActivationToken(token);
  if (verification.status !== "valid") return verification;

  const auth = getAutomyAuth();
  await auth.api.resetPassword({
    body: { token, newPassword: password },
  });

  const pool = await getRailwayPostgresPool();
  const result = await pool.query<{
    id: string;
    company_id: string;
    client_id: string;
    portal_user_id: string;
  }>(
    `
      update public.client_portal_provisioning
      set status = 'activated',
          activated_at = now(),
          activation_token_hash = null,
          updated_at = now()
      where activation_token_hash = $1
        and deleted_at is null
      returning id, company_id, client_id, portal_user_id
    `,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  if (!row) return { status: "invalid" as const };

  const portal = await pool.query<{ auth_user_id: string }>(
    `
      update public.client_portal_users
      set status = 'active', activated_at = now(), updated_at = now()
      where id = $1
      returning auth_user_id
    `,
    [row.portal_user_id],
  );
  const authUserId = portal.rows[0]?.auth_user_id;
  if (authUserId) {
    await pool.query(
      `update public."user" set status = 'active', "updatedAt" = now() where id = $1`,
      [authUserId],
    );
  }
  await recordPortalProvisioningAudit(
    pool,
    { companyId: row.company_id, authUserId: authUserId ?? row.portal_user_id },
    "portal.access.activated",
    "client",
    row.client_id,
    { provisioningId: row.id },
  );
  return { status: "activated" as const };
}

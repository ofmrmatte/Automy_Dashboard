import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import { clientFormSchema, type ClientFormData } from "@/features/clients/validation";
import {
  contractFormSchema,
  contractPatchSchema,
  type ContractFormData,
} from "@/features/contracts/validation";
import {
  productFormSchema,
  productPatchSchema,
  type ProductFormData,
} from "@/features/products/validation";
import {
  jsonResponse,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
  type AuthenticatedUserContext,
  type PermissionKey,
} from "@/shared/server/authz";
import type { QueryResultRow } from "pg";

type QueryableConnection = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
};

type ProductTermsPayload = {
  category?: string | undefined;
  hostedOnAutomyUrl?: boolean | undefined;
  customUrl?: boolean | undefined;
  userLimit?: number | undefined;
  segment?: string | undefined;
  implementationDays?: number | undefined;
  implementationFee?: number | undefined;
  paymentMethod?: string | undefined;
  installments?: number | undefined;
  discountPercent?: number | undefined;
  hasMonthlyFee?: boolean | undefined;
  monthlyFee?: number | undefined;
  hasDatabaseCost?: boolean | undefined;
  databaseCost?: number | undefined;
  extraUserPrice?: number | undefined;
  loyaltyMonths?: number | undefined;
  deliverables?: string | undefined;
};

const APP_DATA_PATHS = new Set([
  "/api/clients",
  "/api/contracts",
  "/api/products",
  "/api/support/tickets",
  "/api/scheduled-calls",
  "/api/settings/profile",
  "/api/settings/preferences",
  "/api/dashboard/summary",
  "/api/dashboard/charts",
  "/api/dashboard/recent-clients",
  "/api/dashboard/activity",
]);

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

async function ensureBusinessSchema() {
  if (!isRailwayPostgresConfigured()) return;

  const db = await getRailwayPostgresPool();
  await db.query("select 1 from public.companies limit 1");
}
async function queryRows<T extends QueryResultRow>(sql: string, values: unknown[] = []) {
  if (!isRailwayPostgresConfigured()) return [];

  try {
    const db = await getRailwayPostgresPool();
    const result = await db.query<T>(sql, values);
    return result.rows;
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

async function handleClients(url: URL, context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const id = url.searchParams.get("id");
  const rows = await queryRows(
    `
      select
        clients.*,
        primary_contact.name as owner_name,
        primary_contact.email as owner_email,
        primary_contact.phone as owner_phone,
        primary_address.street as address_street,
        primary_address.number as address_number,
        primary_address.complement as address_complement,
        primary_address.district as address_district,
        primary_address.city as address_city,
        primary_address.state as address_state,
        primary_address.postal_code as address_postal_code,
        primary_address.country as address_country
      from public.clients
      left join lateral (
        select name, email, phone
        from public.contacts
        where contacts.client_id = clients.id
          and contacts.company_id = clients.company_id
          and contacts.deleted_at is null
        order by contacts.is_primary desc, contacts.created_at asc
        limit 1
      ) as primary_contact on true
      left join lateral (
        select street, number, complement, district, city, state, postal_code, country
        from public.addresses
        where addresses.client_id = clients.id
          and addresses.company_id = clients.company_id
          and addresses.deleted_at is null
        order by addresses.created_at asc
        limit 1
      ) as primary_address on true
      where clients.deleted_at is null
        and clients.company_id = $2
        and ($1::uuid is null or clients.id = $1::uuid)
      order by clients.created_at desc
      limit 200
    `,
    [id, context.companyId],
  );

  return jsonResponse(id ? { client: rows[0] ?? null } : { clients: rows });
}

async function handleCreateClient(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = clientFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query(
      `
        insert into public.clients (
          company_id,
          legal_name,
          trade_name,
          document,
          state_registration,
          municipal_registration,
          segment,
          email,
          phone,
          website,
          notes,
          logo_url,
          city,
          state,
          owner_name,
          plan_name,
          status,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, nullif($8, ''), nullif($9, ''), nullif($10, ''), nullif($11, ''), nullif($12, ''), $13, $14, $15, $16, $17, $18, $18)
        on conflict do nothing
        returning *
      `,
      [
        context.companyId,
        parsed.data.legalName,
        parsed.data.tradeName,
        parsed.data.document.replace(/\D/g, ""),
        parsed.data.stateRegistration,
        parsed.data.municipalRegistration,
        parsed.data.segment,
        parsed.data.email,
        parsed.data.phone,
        parsed.data.website,
        parsed.data.notes,
        parsed.data.logoUrl,
        parsed.data.city,
        parsed.data.state,
        parsed.data.owner,
        parsed.data.plan,
        mapClientStatusToDatabase(parsed.data.status),
        context.authUserId,
      ],
    );

    const created = result.rows[0];
    if (!created) {
      await client.query("rollback");
      return jsonResponse({ error: "Cliente já cadastrado para este CNPJ." }, { status: 409 });
    }

    await upsertPrimaryClientContact(client, context, created.id, parsed.data);
    await upsertPrimaryClientAddress(client, context, created.id, parsed.data);
    await recordClientAudit(client, context, "client.create", created.id, {
      legalName: parsed.data.legalName,
      document: parsed.data.document.replace(/\D/g, ""),
    });
    await client.query("commit");

    return handleClientById(created.id, context, 201);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function mapClientStatusToDatabase(status: string) {
  if (status === "Ativo" || status === "active") return "active";
  if (status === "Implantação" || status === "onboarding") return "onboarding";
  if (status === "Inativo" || status === "inactive") return "inactive";
  if (status === "Bloqueado" || status === "blocked") return "blocked";
  return "pending";
}

async function handleClientById(clientId: string, context: AuthenticatedUserContext, status = 200) {
  const response = await handleClients(
    new URL(`http://automy.local/api/clients?id=${clientId}`),
    context,
  );
  const payload = await response.json();
  return jsonResponse(payload, { status });
}

async function upsertPrimaryClientContact(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  clientId: string,
  payload: ClientFormData,
) {
  if (!payload.owner && !payload.ownerEmail && !payload.ownerPhone) return;

  await db.query(
    `
      update public.contacts
      set
        name = $3,
        email = nullif($4, ''),
        phone = nullif($5, ''),
        role = 'Responsável principal',
        is_primary = true,
        updated_at = now(),
        updated_by = $6
      where id = (
        select id
        from public.contacts
        where company_id = $1
          and client_id = $2
          and deleted_at is null
        order by is_primary desc, created_at asc
        limit 1
      )
    `,
    [
      context.companyId,
      clientId,
      payload.owner || "Responsável principal",
      payload.ownerEmail,
      payload.ownerPhone,
      context.authUserId,
    ],
  );

  await db.query(
    `
      insert into public.contacts (
        company_id,
        client_id,
        name,
        email,
        phone,
        role,
        is_primary,
        created_by,
        updated_by
      )
      select $1, $2, $3, nullif($4, ''), nullif($5, ''), 'Responsável principal', true, $6, $6
      where not exists (
        select 1
        from public.contacts
        where company_id = $1
          and client_id = $2
          and deleted_at is null
      )
    `,
    [
      context.companyId,
      clientId,
      payload.owner || "Responsável principal",
      payload.ownerEmail,
      payload.ownerPhone,
      context.authUserId,
    ],
  );
}

async function upsertPrimaryClientAddress(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  clientId: string,
  payload: ClientFormData,
) {
  const hasAddress = [
    payload.postalCode,
    payload.street,
    payload.number,
    payload.complement,
    payload.district,
    payload.city,
    payload.state,
  ].some(Boolean);
  if (!hasAddress) return;

  await db.query(
    `
      update public.addresses
      set
        street = nullif($3, ''),
        number = nullif($4, ''),
        complement = nullif($5, ''),
        district = nullif($6, ''),
        city = nullif($7, ''),
        state = nullif($8, ''),
        postal_code = nullif($9, ''),
        country = coalesce(nullif($10, ''), 'BR'),
        updated_at = now(),
        updated_by = $11
      where id = (
        select id
        from public.addresses
        where company_id = $1
          and client_id = $2
          and deleted_at is null
        order by created_at asc
        limit 1
      )
    `,
    [
      context.companyId,
      clientId,
      payload.street,
      payload.number,
      payload.complement,
      payload.district,
      payload.city,
      payload.state,
      payload.postalCode,
      payload.country || "BR",
      context.authUserId,
    ],
  );

  await db.query(
    `
      insert into public.addresses (
        company_id,
        client_id,
        label,
        street,
        number,
        complement,
        district,
        city,
        state,
        postal_code,
        country,
        created_by,
        updated_by
      )
      select $1, $2, 'Principal', nullif($3, ''), nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), nullif($8, ''), nullif($9, ''), coalesce(nullif($10, ''), 'BR'), $11, $11
      where not exists (
        select 1
        from public.addresses
        where company_id = $1
          and client_id = $2
          and deleted_at is null
      )
    `,
    [
      context.companyId,
      clientId,
      payload.street,
      payload.number,
      payload.complement,
      payload.district,
      payload.city,
      payload.state,
      payload.postalCode,
      payload.country || "BR",
      context.authUserId,
    ],
  );
}

async function recordClientAudit(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  action: string,
  clientId: string,
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
      values ($1, $2, $3, $4, 'client', $5, $6, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      clientId,
      JSON.stringify(metadata),
    ],
  );

  await db.query(
    `
      insert into public.activity_logs (
        company_id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, 'client', $3, $4, $5, $6, $6)
    `,
    [
      context.companyId,
      context.domainUserId,
      clientId,
      action,
      JSON.stringify(metadata),
      context.authUserId,
    ],
  );
}

async function handleUpdateClient(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = clientFormSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) {
    return jsonResponse(
      { error: parsed.error?.issues[0]?.message ?? "Cliente não informado." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query(
      `
        update public.clients
        set
          legal_name = $3,
          trade_name = $4,
          document = $5,
          state_registration = $6,
          municipal_registration = $7,
          segment = $8,
          email = nullif($9, ''),
          phone = nullif($10, ''),
          website = nullif($11, ''),
          notes = nullif($12, ''),
          logo_url = nullif($13, ''),
          city = $14,
          state = $15,
          owner_name = $16,
          plan_name = $17,
          status = $18,
          updated_at = now(),
          updated_by = $19
        where id = $1
          and company_id = $2
          and deleted_at is null
        returning id
      `,
      [
        parsed.data.id,
        context.companyId,
        parsed.data.legalName,
        parsed.data.tradeName,
        parsed.data.document.replace(/\D/g, ""),
        parsed.data.stateRegistration,
        parsed.data.municipalRegistration,
        parsed.data.segment,
        parsed.data.email,
        parsed.data.phone,
        parsed.data.website,
        parsed.data.notes,
        parsed.data.logoUrl,
        parsed.data.city,
        parsed.data.state,
        parsed.data.owner,
        parsed.data.plan,
        mapClientStatusToDatabase(parsed.data.status),
        context.authUserId,
      ],
    );

    if (!result.rows[0]) {
      await client.query("rollback");
      return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
    }

    await upsertPrimaryClientContact(client, context, parsed.data.id, parsed.data);
    await upsertPrimaryClientAddress(client, context, parsed.data.id, parsed.data);
    await recordClientAudit(client, context, "client.update", parsed.data.id, {
      status: parsed.data.status,
    });
    await client.query("commit");

    return handleClientById(parsed.data.id, context);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleDeleteClient(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return jsonResponse({ error: "Cliente não informado." }, { status: 400 });

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      update public.clients
      set deleted_at = now(), updated_at = now(), updated_by = $3
      where id = $1
        and company_id = $2
        and deleted_at is null
      returning id
    `,
    [id, context.companyId, context.authUserId],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
  }

  await recordClientAudit(db, context, "client.delete", id);
  return jsonResponse({ ok: true });
}

async function handleContracts(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const contracts = await queryRows(
    `
    select
      contracts.*,
      clients.trade_name as client_trade_name,
      clients.legal_name as client_legal_name,
      products.name as product_name
    from public.contracts
    left join public.clients on clients.id = contracts.client_id
    left join public.products on products.id = contracts.product_id
    where contracts.deleted_at is null
      and contracts.company_id = $1
    order by contracts.created_at desc
    limit 200
  `,
    [context.companyId],
  );

  return jsonResponse({ contracts });
}

async function handleProducts(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const products = await queryRows(
    `
    select
      products.*,
      count(distinct contracts.client_id)::int as clients,
      count(contracts.id)::int as contracts
    from public.products
    left join public.contracts
      on contracts.product_id = products.id
      and contracts.company_id = $1
      and contracts.deleted_at is null
    where products.deleted_at is null
      and products.company_id = $1
    group by products.id
    order by products.created_at desc
    limit 200
  `,
    [context.companyId],
  );

  return jsonResponse({ products });
}

async function handleCreateProduct(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = productFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query(
      `
        insert into public.products (
          company_id,
          name,
          category,
          version,
          description,
          status,
          base_price,
          billing_mode,
          notes,
          commercial_terms,
          contract_template,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, nullif($5, ''), $6, $7, $8, nullif($9, ''), $10, nullif($11, ''), $12, $12)
        on conflict do nothing
        returning *
      `,
      [
        context.companyId,
        parsed.data.name,
        parsed.data.category,
        parsed.data.version,
        parsed.data.description,
        mapProductStatusToDatabase(parsed.data.status),
        parsed.data.basePrice,
        parsed.data.billingMode,
        parsed.data.notes,
        JSON.stringify(buildProductCommercialTerms(parsed.data)),
        parsed.data.contractTemplate,
        context.authUserId,
      ],
    );

    const created = result.rows[0];
    if (!created) {
      await client.query("rollback");
      return jsonResponse({ error: "Produto já cadastrado." }, { status: 409 });
    }

    await recordProductAudit(client, context, "product.create", created.id, {
      name: parsed.data.name,
      status: parsed.data.status,
    });
    await client.query("commit");

    return handleProductById(created.id, context, 201);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateProduct(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = productPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Produto não informado." },
      { status: 400 },
    );
  }

  await ensureBusinessSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query(
      `
        update public.products
        set
          name = coalesce(nullif($3, ''), name),
          category = coalesce(nullif($4, ''), category),
          version = coalesce(nullif($5, ''), version),
          description = coalesce($6, description),
          status = coalesce(nullif($7, ''), status),
          base_price = coalesce($8, base_price),
          billing_mode = coalesce(nullif($9, ''), billing_mode),
          notes = coalesce($10, notes),
          commercial_terms = coalesce($11, commercial_terms),
          contract_template = coalesce($12, contract_template),
          updated_by = $13,
          updated_at = now()
        where id = $1
          and company_id = $2
          and deleted_at is null
        returning *
      `,
      [
        parsed.data.id,
        context.companyId,
        parsed.data.name ?? "",
        parsed.data.category ?? "",
        parsed.data.version ?? "",
        parsed.data.description ?? null,
        mapProductStatusToDatabase(parsed.data.status ?? ""),
        parsed.data.basePrice ?? null,
        parsed.data.billingMode ?? "",
        parsed.data.notes ?? null,
        hasCompleteProductTerms(parsed.data)
          ? JSON.stringify(buildProductCommercialTerms(parsed.data))
          : null,
        parsed.data.contractTemplate ?? null,
        context.authUserId,
      ],
    );

    const updated = result.rows[0];
    if (!updated) {
      await client.query("rollback");
      return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
    }

    await recordProductAudit(client, context, "product.update", updated.id, {
      name: updated.name,
      status: updated.status,
    });
    await client.query("commit");

    return handleProductById(updated.id, context);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleDeleteProduct(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return jsonResponse({ error: "Produto não informado." }, { status: 400 });

  await ensureBusinessSchema();
  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      update public.products
      set deleted_at = now(), updated_at = now(), updated_by = $3
      where id = $1
        and company_id = $2
        and deleted_at is null
      returning id
    `,
    [id, context.companyId, context.authUserId],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  await recordProductAudit(db, context, "product.delete", id);

  return jsonResponse({ ok: true });
}

function mapProductStatusToDatabase(status: string) {
  if (status === "Ativo" || status === "active") return "active";
  if (status === "Beta" || status === "beta") return "beta";
  if (status === "Inativo" || status === "inactive") return "inactive";
  if (status === "Descontinuando" || status === "discontinuing") return "discontinuing";
  return "";
}

async function handleProductById(
  productId: string,
  context: AuthenticatedUserContext,
  status = 200,
) {
  const rows = await queryRows(
    `
      select
        products.*,
        count(distinct contracts.client_id)::int as clients,
        count(contracts.id)::int as contracts
      from public.products
      left join public.contracts
        on contracts.product_id = products.id
        and contracts.company_id = $1
        and contracts.deleted_at is null
      where products.id = $2
        and products.company_id = $1
        and products.deleted_at is null
      group by products.id
      limit 1
    `,
    [context.companyId, productId],
  );

  return jsonResponse({ product: rows[0] ?? null }, { status });
}

function buildProductCommercialTerms(payload: ProductTermsPayload) {
  return {
    hostedOnAutomyUrl: payload.hostedOnAutomyUrl ?? true,
    customUrl: payload.customUrl ?? false,
    userLimit: payload.userLimit ?? 5,
    segment: payload.segment || payload.category || "Automação operacional",
    implementationDays: payload.implementationDays ?? 30,
    implementationFee: payload.implementationFee ?? 0,
    paymentMethod: payload.paymentMethod ?? "Boleto à vista",
    installments: payload.installments ?? 1,
    discountPercent: payload.discountPercent ?? 0,
    hasMonthlyFee: payload.hasMonthlyFee ?? true,
    monthlyFee: payload.monthlyFee ?? 0,
    hasDatabaseCost: payload.hasDatabaseCost ?? false,
    databaseCost: payload.databaseCost ?? 0,
    extraUserPrice: payload.extraUserPrice ?? 0,
    loyaltyMonths: payload.loyaltyMonths ?? 12,
    deliverables:
      payload.deliverables ??
      "Implantação, configuração inicial, treinamento operacional e suporte conforme plano contratado.",
  };
}

function hasCompleteProductTerms(payload: ProductTermsPayload) {
  return Boolean(
    payload.paymentMethod &&
    payload.deliverables &&
    payload.userLimit !== undefined &&
    payload.implementationDays !== undefined,
  );
}

async function recordProductAudit(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  action: string,
  productId: string,
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
      values ($1, $2, $3, $4, 'product', $5, $6, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      productId,
      JSON.stringify(metadata),
    ],
  );

  await db.query(
    `
      insert into public.activity_logs (
        company_id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, 'product', $3, $4, $5, $6, $6)
    `,
    [
      context.companyId,
      context.domainUserId,
      productId,
      action,
      JSON.stringify(metadata),
      context.authUserId,
    ],
  );
}

async function handleCreateContract(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = contractFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query(
      `
        insert into public.contracts (
          company_id,
          client_id,
          product_id,
          name,
          monthly_value,
          implementation_value,
          starts_at,
          ends_at,
          renewal_at,
          billing_period,
          status,
          signer_name,
          witness_name,
          contract_text,
          notes,
          created_by,
          updated_by
        )
        select
          $1,
          clients.id,
          products.id,
          $4,
          $5,
          $6,
          $7::date,
          $8::date,
          nullif($9, '')::date,
          $10,
          $11,
          $12,
          nullif($13, ''),
          nullif($14, ''),
          nullif($15, ''),
          $16,
          $16
        from public.clients
        cross join public.products
        where clients.id = $2
          and clients.company_id = $1
          and clients.deleted_at is null
          and products.id = $3
          and products.company_id = $1
          and products.deleted_at is null
        returning *
      `,
      contractQueryValues(parsed.data, context),
    );

    const created = result.rows[0];
    if (!created) {
      await client.query("rollback");
      return jsonResponse({ error: "Cliente ou produto não encontrado." }, { status: 404 });
    }

    await upsertContractItem(client, context, created.id, parsed.data);
    await recordContractAudit(client, context, "contract.create", created.id, {
      clientId: parsed.data.clientId,
      productId: parsed.data.productId,
      status: parsed.data.status,
    });
    await client.query("commit");

    return handleContractById(created.id, context, 201);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateContract(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const parsed = contractPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Contrato não informado." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const status = mapContractStatusToDatabase(parsed.data.status ?? "");
    const result = await client.query(
      `
        update public.contracts
        set
          client_id = coalesce($3, client_id),
          product_id = coalesce($4, product_id),
          name = coalesce(nullif($5, ''), name),
          monthly_value = coalesce($6, monthly_value),
          implementation_value = coalesce($7, implementation_value),
          starts_at = coalesce($8::date, starts_at),
          ends_at = coalesce($9::date, ends_at),
          renewal_at = coalesce(nullif($10, '')::date, renewal_at),
          billing_period = coalesce(nullif($11, ''), billing_period),
          status = coalesce(nullif($12, ''), status),
          signer_name = coalesce(nullif($13, ''), signer_name),
          witness_name = $14,
          contract_text = coalesce($15, contract_text),
          notes = coalesce($16, notes),
          cancelled_at = case when $12 = 'cancelled' then now() else cancelled_at end,
          ended_at = case when $12 = 'ended' then now() else ended_at end,
          updated_by = $17,
          updated_at = now()
        where id = $1
          and company_id = $2
          and deleted_at is null
        returning *
      `,
      [
        parsed.data.id,
        context.companyId,
        parsed.data.clientId ?? null,
        parsed.data.productId ?? null,
        parsed.data.name ?? "",
        parsed.data.monthlyValue ?? null,
        parsed.data.implementationValue ?? null,
        parsed.data.startsAt ?? null,
        parsed.data.endsAt ?? null,
        parsed.data.renewalAt ?? "",
        parsed.data.billingPeriod ?? "",
        status,
        parsed.data.signerName ?? "",
        parsed.data.witnessName ?? null,
        parsed.data.contractText ?? null,
        parsed.data.notes ?? null,
        context.authUserId,
      ],
    );

    const updated = result.rows[0];
    if (!updated) {
      await client.query("rollback");
      return jsonResponse({ error: "Contrato não encontrado." }, { status: 404 });
    }

    if (parsed.data.productId || parsed.data.monthlyValue !== undefined) {
      await upsertContractItem(client, context, updated.id, {
        ...parsed.data,
        clientId: updated.client_id,
        productId: updated.product_id,
        name: updated.name ?? "",
        monthlyValue: Number(updated.monthly_value ?? 0),
        implementationValue: Number(updated.implementation_value ?? 0),
        startsAt: updated.starts_at ?? "",
        endsAt: updated.ends_at ?? "",
        billingPeriod: updated.billing_period ?? "Mensal",
        status: parsed.data.status ?? "Pendente",
        signerName: updated.signer_name ?? "",
        renewalAt: updated.renewal_at ?? "",
        witnessName: updated.witness_name ?? "",
        notes: updated.notes ?? "",
        contractText: updated.contract_text ?? "",
      });
    }

    await recordContractAudit(client, context, "contract.update", updated.id, {
      status: updated.status,
    });
    await client.query("commit");

    return handleContractById(updated.id, context);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleDeleteContract(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return jsonResponse({ error: "Contrato não informado." }, { status: 400 });

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      update public.contracts
      set deleted_at = now(), updated_at = now(), updated_by = $3
      where id = $1
        and company_id = $2
        and deleted_at is null
      returning id
    `,
    [id, context.companyId, context.authUserId],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Contrato não encontrado." }, { status: 404 });
  }

  await recordContractAudit(db, context, "contract.delete", id);
  return jsonResponse({ ok: true });
}

function contractQueryValues(payload: ContractFormData, context: AuthenticatedUserContext) {
  return [
    context.companyId,
    payload.clientId,
    payload.productId,
    payload.name,
    payload.monthlyValue,
    payload.implementationValue,
    payload.startsAt,
    payload.endsAt,
    payload.renewalAt,
    payload.billingPeriod,
    mapContractStatusToDatabase(payload.status),
    payload.signerName,
    payload.witnessName,
    payload.contractText,
    payload.notes,
    context.authUserId,
  ];
}

function mapContractStatusToDatabase(status: string) {
  if (status === "Ativo" || status === "active") return "active";
  if (status === "Implantação" || status === "onboarding") return "onboarding";
  if (status === "Renovação" || status === "renewal") return "renewal";
  if (status === "Suspenso" || status === "suspended") return "suspended";
  if (status === "Cancelado" || status === "cancelled") return "cancelled";
  if (status === "Encerrado" || status === "ended") return "ended";
  return "pending";
}

async function handleContractById(
  contractId: string,
  context: AuthenticatedUserContext,
  status = 200,
) {
  const rows = await queryRows(
    `
      select
        contracts.*,
        clients.trade_name as client_trade_name,
        clients.legal_name as client_legal_name,
        products.name as product_name
      from public.contracts
      left join public.clients on clients.id = contracts.client_id
      left join public.products on products.id = contracts.product_id
      where contracts.id = $2
        and contracts.deleted_at is null
        and contracts.company_id = $1
      limit 1
    `,
    [context.companyId, contractId],
  );

  return jsonResponse({ contract: rows[0] ?? null }, { status });
}

async function upsertContractItem(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  contractId: string,
  payload: ContractFormData,
) {
  await db.query(
    `
      update public.contract_items
      set
        product_id = $3,
        name = $4,
        quantity = 1,
        unit_price = $5,
        monthly_value = $5,
        updated_at = now(),
        updated_by = $6
      where id = (
        select id
        from public.contract_items
        where company_id = $1
          and contract_id = $2
          and deleted_at is null
        order by created_at asc
        limit 1
      )
    `,
    [
      context.companyId,
      contractId,
      payload.productId,
      payload.name,
      payload.monthlyValue,
      context.authUserId,
    ],
  );

  await db.query(
    `
      insert into public.contract_items (
        company_id,
        contract_id,
        product_id,
        name,
        quantity,
        unit_price,
        monthly_value,
        created_by,
        updated_by
      )
      select $1, $2, $3, $4, 1, $5, $5, $6, $6
      where not exists (
        select 1
        from public.contract_items
        where company_id = $1
          and contract_id = $2
          and deleted_at is null
      )
    `,
    [
      context.companyId,
      contractId,
      payload.productId,
      payload.name,
      payload.monthlyValue,
      context.authUserId,
    ],
  );
}

async function recordContractAudit(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  action: string,
  contractId: string,
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
      values ($1, $2, $3, $4, 'contract', $5, $6, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      contractId,
      JSON.stringify(metadata),
    ],
  );

  await db.query(
    `
      insert into public.activity_logs (
        company_id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, 'contract', $3, $4, $5, $6, $6)
    `,
    [
      context.companyId,
      context.domainUserId,
      contractId,
      action,
      JSON.stringify(metadata),
      context.authUserId,
    ],
  );
}

async function handleDashboardSummary(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const canReadContracts = hasPermission(context, "contracts.read");
  const canReadFinance = hasPermission(context, "finance.read");
  const canReadSupport = hasPermission(context, "support.read");
  const canReadSchedule = hasPermission(context, "schedule.read");
  const canReadUsers = hasPermission(context, "users.read");

  const [clients, contracts, charges, tickets, calls, users] = await Promise.all([
    queryRows<{
      active_clients: number;
      onboarding_clients: number;
      inactive_clients: number;
    }>(
      `
      select
        count(*) filter (where status = 'active')::int as active_clients,
        count(*) filter (where status = 'onboarding')::int as onboarding_clients,
        count(*) filter (where status = 'inactive')::int as inactive_clients
      from public.clients
      where deleted_at is null
        and company_id = $1
    `,
      [context.companyId],
    ),
    canReadContracts
      ? queryRows<{
          active_contracts: number;
          expiring_contracts_30: number;
          expiring_contracts_60: number;
          monthly_revenue: string | number | null;
        }>(
          `
          select
            count(*) filter (where status = 'active')::int as active_contracts,
            count(*) filter (
              where status in ('active', 'onboarding', 'renewal')
                and ends_at >= current_date
                and ends_at <= current_date + interval '30 days'
            )::int as expiring_contracts_30,
            count(*) filter (
              where status in ('active', 'onboarding', 'renewal')
                and ends_at >= current_date
                and ends_at <= current_date + interval '60 days'
            )::int as expiring_contracts_60,
            coalesce(sum(monthly_value) filter (where status = 'active'), 0) as monthly_revenue
          from public.contracts
          where deleted_at is null
            and company_id = $1
        `,
          [context.companyId],
        )
      : [],
    canReadFinance
      ? queryRows<{ pending_charges: number; overdue_charges: number }>(
          `
          select
            count(*) filter (where status = 'pending')::int as pending_charges,
            count(*) filter (
              where status = 'overdue'
                or (status = 'pending' and due_date is not null and due_date < current_date)
            )::int as overdue_charges
          from public.charges
          where deleted_at is null
            and company_id = $1
        `,
          [context.companyId],
        )
      : [],
    canReadSupport
      ? queryRows<{ open_tickets: number; critical_tickets: number }>(
          `
          select
            count(*) filter (where status not in ('Resolvido', 'Fechado', 'Cancelado'))::int as open_tickets,
            count(*) filter (
              where priority in ('Crítica', 'Critica')
                and status not in ('Resolvido', 'Fechado', 'Cancelado')
            )::int as critical_tickets
          from public.support_tickets
          where deleted_at is null
            and company_id = $1
        `,
          [context.companyId],
        )
      : [],
    canReadSchedule
      ? queryRows<{ future_scheduled_calls: number }>(
          `
          select count(*)::int as future_scheduled_calls
          from public.scheduled_calls
          where deleted_at is null
            and company_id = $1
            and status = 'Agendada'
            and scheduled_date >= current_date
        `,
          [context.companyId],
        )
      : [],
    canReadUsers
      ? queryRows<{ active_users: number }>(
          `
          select count(*)::int as active_users
          from public.users
          where deleted_at is null
            and company_id = $1
            and status = 'active'
        `,
          [context.companyId],
        )
      : [],
  ]);

  const clientTotals = clients[0];
  const contractTotals = contracts[0];
  const chargeTotals = charges[0];
  const ticketTotals = tickets[0];
  const callTotals = calls[0];
  const userTotals = users[0];
  const monthlyRevenue = Number(contractTotals?.monthly_revenue ?? 0);

  return jsonResponse({
    summary: {
      activeClients: Number(clientTotals?.active_clients ?? 0),
      onboardingClients: Number(clientTotals?.onboarding_clients ?? 0),
      inactiveClients: Number(clientTotals?.inactive_clients ?? 0),
      activeContracts: Number(contractTotals?.active_contracts ?? 0),
      expiringContracts30: Number(contractTotals?.expiring_contracts_30 ?? 0),
      expiringContracts60: Number(contractTotals?.expiring_contracts_60 ?? 0),
      expiringContracts: Number(contractTotals?.expiring_contracts_60 ?? 0),
      monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      pendingCharges: Number(chargeTotals?.pending_charges ?? 0),
      overdueCharges: Number(chargeTotals?.overdue_charges ?? 0),
      openTickets: Number(ticketTotals?.open_tickets ?? 0),
      criticalTickets: Number(ticketTotals?.critical_tickets ?? 0),
      futureScheduledCalls: Number(callTotals?.future_scheduled_calls ?? 0),
      activeUsers: Number(userTotals?.active_users ?? 0),
    },
  });
}

async function handleDashboardRecentClients(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const clients = await queryRows(
    `
    select
      id,
      trade_name,
      legal_name,
      city,
      state,
      status,
      created_at,
      updated_at,
      deleted_at,
      created_by,
      updated_by
    from public.clients
    where deleted_at is null
      and company_id = $1
    order by created_at desc
    limit 4
  `,
    [context.companyId],
  );

  return jsonResponse({ clients });
}

async function handleDashboardCharts(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const canReadContracts = hasPermission(context, "contracts.read");
  const canReadFinance = hasPermission(context, "finance.read");
  const canReadSupport = hasPermission(context, "support.read");
  const timezone = await resolveUserTimezone(context);

  const [
    clientGrowth,
    revenueGrowth,
    contractsByStatus,
    ticketsByPriority,
    productsByUsage,
    chargesByStatus,
  ] = await Promise.all([
    queryRows<{ month: string; active: number; onboarding: number }>(
      `
        with months as (
          select generate_series(
            date_trunc('month', timezone($2, now())) - interval '5 months',
            date_trunc('month', timezone($2, now())),
            interval '1 month'
          ) as month_start
        )
        select
          to_char(months.month_start, 'MM/YYYY') as month,
          count(clients.id) filter (where clients.status = 'active')::int as active,
          count(clients.id) filter (where clients.status = 'onboarding')::int as onboarding
        from months
        left join public.clients
          on date_trunc('month', timezone($2, clients.created_at)) = months.month_start
          and clients.company_id = $1
          and clients.deleted_at is null
        group by months.month_start
        order by months.month_start
      `,
      [context.companyId, timezone],
    ),
    canReadContracts
      ? queryRows<{ month: string; revenue: string | number | null }>(
          `
            with months as (
              select generate_series(
                date_trunc('month', timezone($2, now())) - interval '5 months',
                date_trunc('month', timezone($2, now())),
                interval '1 month'
              )::date as month_start
            )
            select
              to_char(months.month_start, 'MM/YYYY') as month,
              coalesce(sum(contracts.monthly_value), 0) as revenue
            from months
            left join public.contracts
              on contracts.company_id = $1
              and contracts.deleted_at is null
              and contracts.status = 'active'
              and (contracts.starts_at is null or contracts.starts_at <= (months.month_start + interval '1 month - 1 day')::date)
              and (contracts.ends_at is null or contracts.ends_at >= months.month_start)
            group by months.month_start
            order by months.month_start
          `,
          [context.companyId, timezone],
        )
      : [],
    canReadContracts
      ? queryRows<{ name: string; value: number }>(
          `
            select status as name, count(*)::int as value
            from public.contracts
            where deleted_at is null
              and company_id = $1
            group by status
            order by value desc, status asc
          `,
          [context.companyId],
        )
      : [],
    canReadSupport
      ? queryRows<{ name: string; value: number }>(
          `
            select priority as name, count(*)::int as value
            from public.support_tickets
            where deleted_at is null
              and company_id = $1
            group by priority
            order by value desc, priority asc
          `,
          [context.companyId],
        )
      : [],
    canReadContracts
      ? queryRows<{ name: string; clients: number }>(
          `
            select
              products.name,
              count(distinct contracts.client_id)::int as clients
            from public.products
            left join public.contracts
              on contracts.product_id = products.id
              and contracts.company_id = $1
              and contracts.deleted_at is null
              and contracts.status in ('active', 'onboarding', 'renewal')
            where products.deleted_at is null
              and products.company_id = $1
            group by products.id, products.name
            order by clients desc, products.name asc
            limit 8
          `,
          [context.companyId],
        )
      : [],
    canReadFinance
      ? queryRows<{ name: string; value: number }>(
          `
            select
              case
                when status = 'pending' and due_date is not null and due_date < current_date then 'Atrasado'
                when status = 'pending' then 'Pendente'
                when status = 'paid' then 'Pago'
                when status = 'overdue' then 'Atrasado'
                when status = 'canceled' then 'Cancelado'
                when status = 'failed' then 'Falhou'
                else status
              end as name,
              count(*)::int as value
            from public.charges
            where deleted_at is null
              and company_id = $1
            group by name
            order by value desc, name asc
          `,
          [context.companyId],
        )
      : [],
  ]);

  return jsonResponse({
    charts: {
      clientGrowth,
      revenueGrowth: revenueGrowth.map((point) => ({
        month: point.month,
        revenue: Number(point.revenue ?? 0),
      })),
      contractsByStatus,
      ticketsByPriority,
      productsByUsage,
      chargesByStatus,
    },
  });
}

async function handleDashboardActivity(context: AuthenticatedUserContext) {
  const activities = await queryRows(
    `
    select *
    from public.activity_logs
    where deleted_at is null
      and company_id = $1
    order by created_at desc
    limit 5
  `,
    [context.companyId],
  );

  return jsonResponse({ activities });
}

async function resolveUserTimezone(context: AuthenticatedUserContext) {
  const preferences = await queryRows<{ time_zone: string }>(
    `
    select time_zone
    from public.user_preferences
    where auth_user_id = $1
      and deleted_at is null
    limit 1
  `,
    [context.authUserId],
  );

  return preferences[0]?.time_zone || "America/Sao_Paulo";
}

async function handleTickets(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const tickets = await queryRows(
    `
    select *
    from public.support_tickets
    where deleted_at is null
      and company_id = $1
    order by created_at desc
    limit 200
  `,
    [context.companyId],
  );

  return jsonResponse({ tickets });
}

async function handleScheduledCalls(context: AuthenticatedUserContext) {
  await ensureBusinessSchema();

  const calls = await queryRows(
    `
    select *
    from public.scheduled_calls
    where deleted_at is null
      and company_id = $1
    order by scheduled_date asc, scheduled_time asc
    limit 500
  `,
    [context.companyId],
  );

  return jsonResponse({ calls });
}

async function handleCreateScheduledCall(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    scheduledDate?: unknown;
    scheduledTime?: unknown;
    title?: unknown;
    clientName?: unknown;
    contactName?: unknown;
    contactEmail?: unknown;
    contactPhone?: unknown;
    meetingLink?: unknown;
    notes?: unknown;
    status?: unknown;
  };
  const scheduledDate =
    typeof payload.scheduledDate === "string" ? payload.scheduledDate.trim() : "";
  const scheduledTime =
    typeof payload.scheduledTime === "string" ? payload.scheduledTime.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";

  if (!scheduledDate || !scheduledTime || !title || !clientName) {
    return jsonResponse(
      { error: "Data, horário, título e cliente são obrigatórios." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      insert into public.scheduled_calls (
        company_id,
        scheduled_date,
        scheduled_time,
        title,
        client_name,
        contact_name,
        contact_email,
        contact_phone,
        meeting_link,
        notes,
        status,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      returning *
    `,
    [
      context.companyId,
      scheduledDate,
      scheduledTime,
      title,
      clientName,
      typeof payload.contactName === "string" ? payload.contactName : "",
      typeof payload.contactEmail === "string" ? payload.contactEmail : "",
      typeof payload.contactPhone === "string" ? payload.contactPhone : "",
      typeof payload.meetingLink === "string" ? payload.meetingLink : "",
      typeof payload.notes === "string" ? payload.notes : "",
      typeof payload.status === "string" ? payload.status : "Agendada",
      context.domainUserId,
    ],
  );

  return jsonResponse({ call: result.rows[0] }, { status: 201 });
}

async function handleCreateTicket(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    clientName?: unknown;
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    owner?: unknown;
    status?: unknown;
  };
  const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";

  if (!clientName || !title) {
    return jsonResponse({ error: "Cliente e título são obrigatórios." }, { status: 400 });
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      insert into public.support_tickets (
        company_id,
        client_name,
        title,
        description,
        priority,
        owner,
        status,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      returning *
    `,
    [
      context.companyId,
      clientName,
      title,
      typeof payload.description === "string" ? payload.description : "",
      typeof payload.priority === "string" ? payload.priority : "Média",
      typeof payload.owner === "string" ? payload.owner : "Automy",
      typeof payload.status === "string" ? payload.status : "Aberto",
      context.domainUserId,
    ],
  );

  return jsonResponse({ ticket: result.rows[0] }, { status: 201 });
}

function assertOwnResource(authUserId: string, currentUserId: string) {
  return authUserId === currentUserId;
}

function requiredPermissionForRequest(pathname: string, method: string): PermissionKey | null {
  const isRead = method === "GET";

  if (pathname === "/api/clients") return isRead ? "clients.read" : "clients.manage";
  if (pathname === "/api/contracts") return isRead ? "contracts.read" : "contracts.manage";
  if (pathname === "/api/products") return isRead ? "products.read" : "products.manage";
  if (pathname === "/api/support/tickets") return isRead ? "support.read" : "support.manage";
  if (pathname === "/api/scheduled-calls") return isRead ? "schedule.read" : "schedule.manage";
  if (pathname === "/api/dashboard/summary") return "clients.read";
  if (pathname === "/api/dashboard/charts") return "clients.read";
  if (pathname === "/api/dashboard/recent-clients") return "clients.read";
  if (pathname === "/api/dashboard/activity") return "audit.read";
  if (pathname === "/api/settings/profile") return isRead ? "settings.read" : "settings.manage";
  if (pathname === "/api/settings/preferences") return isRead ? "settings.read" : "settings.manage";

  return null;
}

async function handleSetting(request: Request, url: URL, keyPrefix: string, currentUserId: string) {
  await ensureBusinessSchema();

  const authUserId = url.searchParams.get("authUserId");
  if (!authUserId) {
    return jsonResponse({ error: "Usuário não informado." }, { status: 400 });
  }

  if (!assertOwnResource(authUserId, currentUserId)) {
    return jsonResponse({ error: "Permissão insuficiente." }, { status: 403 });
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query<{ value: unknown }>(
    `
      select value
      from public.app_settings
      where key = $1
      limit 1
    `,
    [`${keyPrefix}:${authUserId}`],
  );

  return jsonResponse({ value: result.rows[0]?.value ?? null });
}

async function handleUpdateSetting(request: Request, keyPrefix: string, currentUserId: string) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as { authUserId?: unknown; value?: unknown };
  const authUserId = typeof payload.authUserId === "string" ? payload.authUserId : "";
  if (!authUserId) {
    return jsonResponse({ error: "Usuário não informado." }, { status: 400 });
  }

  if (!assertOwnResource(authUserId, currentUserId)) {
    return jsonResponse({ error: "Permissão insuficiente." }, { status: 403 });
  }

  await ensureBusinessSchema();
  const db = await getRailwayPostgresPool();
  const result = await db.query<{ value: unknown }>(
    `
      insert into public.app_settings (key, value)
      values ($1, $2)
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
      returning value
    `,
    [`${keyPrefix}:${authUserId}`, JSON.stringify(payload.value ?? {})],
  );

  return jsonResponse({ value: result.rows[0]?.value ?? null });
}

export async function handleAppDataApiRequest(request: Request) {
  const url = new URL(request.url);
  if (!APP_DATA_PATHS.has(url.pathname)) return null;

  const auth = await requireAuthenticatedUser(request);
  if (auth.error) return auth.error;

  const requiredPermission = requiredPermissionForRequest(url.pathname, request.method);
  if (requiredPermission) {
    const permissionError = requirePermission(auth.context, requiredPermission);
    if (permissionError) return permissionError;
  }

  if (request.method === "POST" && url.pathname === "/api/products") {
    return handleCreateProduct(request, auth.context);
  }

  if (request.method === "PATCH" && url.pathname === "/api/products") {
    return handleUpdateProduct(request, auth.context);
  }

  if (request.method === "DELETE" && url.pathname === "/api/products") {
    return handleDeleteProduct(request, auth.context);
  }

  if (request.method === "POST" && url.pathname === "/api/clients") {
    return handleCreateClient(request, auth.context);
  }

  if (request.method === "PATCH" && url.pathname === "/api/clients") {
    return handleUpdateClient(request, auth.context);
  }

  if (request.method === "DELETE" && url.pathname === "/api/clients") {
    return handleDeleteClient(request, auth.context);
  }

  if (request.method === "POST" && url.pathname === "/api/contracts") {
    return handleCreateContract(request, auth.context);
  }

  if (request.method === "PATCH" && url.pathname === "/api/contracts") {
    return handleUpdateContract(request, auth.context);
  }

  if (request.method === "DELETE" && url.pathname === "/api/contracts") {
    return handleDeleteContract(request, auth.context);
  }

  if (request.method === "POST" && url.pathname === "/api/support/tickets") {
    return handleCreateTicket(request, auth.context);
  }

  if (request.method === "POST" && url.pathname === "/api/scheduled-calls") {
    return handleCreateScheduledCall(request, auth.context);
  }

  if (request.method === "PUT" && url.pathname === "/api/settings/profile") {
    return handleUpdateSetting(request, "profile", auth.context.authUserId);
  }

  if (request.method === "PUT" && url.pathname === "/api/settings/preferences") {
    return handleUpdateSetting(request, "preferences", auth.context.authUserId);
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  if (url.pathname === "/api/clients") return handleClients(url, auth.context);
  if (url.pathname === "/api/contracts") return handleContracts(auth.context);
  if (url.pathname === "/api/products") return handleProducts(auth.context);
  if (url.pathname === "/api/support/tickets") return handleTickets(auth.context);
  if (url.pathname === "/api/scheduled-calls") return handleScheduledCalls(auth.context);
  if (url.pathname === "/api/settings/profile") {
    return handleSetting(request, url, "profile", auth.context.authUserId);
  }
  if (url.pathname === "/api/settings/preferences") {
    return handleSetting(request, url, "preferences", auth.context.authUserId);
  }
  if (url.pathname === "/api/dashboard/summary") return handleDashboardSummary(auth.context);
  if (url.pathname === "/api/dashboard/charts") return handleDashboardCharts(auth.context);
  if (url.pathname === "/api/dashboard/recent-clients") {
    return handleDashboardRecentClients(auth.context);
  }
  return handleDashboardActivity(auth.context);
}

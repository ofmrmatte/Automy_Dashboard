import { z } from "zod";
import { getBetterAuthSessionFromRequest } from "@/features/identity/server/better-auth";
import {
  generateContractPdf,
  loadContractPdfBrandAssets,
  type ContractPdfItem,
} from "@/features/contracts/server/contract-pdf-service";
import { contractPdfHeaders } from "@/features/contracts/server/contract-pdf-http";
import {
  ContractConsistencyError,
  validateContractConsistency,
} from "@/features/contracts/utils/contract-consistency";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import { jsonResponse } from "@/shared/server/authz";
import {
  activatePortalInvitation,
  verifyPortalActivationToken,
} from "@/features/portal/server/portal-provisioning";

function portalJson(payload: unknown, init?: ResponseInit) {
  return jsonResponse(payload, {
    ...init,
    headers: {
      "cache-control": "private, no-store",
      pragma: "no-cache",
      vary: "cookie",
      ...init?.headers,
    },
  });
}

type Queryable = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

type PortalContext = {
  authUserId: string;
  portalUserId: string;
  companyId: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  role:
    | "customer"
    | "customer_admin"
    | "finance"
    | "operations"
    | "read_only"
    | "billing"
    | "technical";
};

type PortalAuthResult =
  { context: PortalContext; error?: never } | { context?: never; error: Response };

type PortalUserRow = {
  portal_user_id: string;
  company_id: string;
  client_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: PortalContext["role"];
  portal_status: string;
  auth_status: string;
  client_status: string;
};

type ContractRow = Record<string, unknown> & {
  id: string;
  company_id: string;
  client_id: string;
  product_id: string | null;
  name: string | null;
  description: string | null;
  scope: string | null;
  deliverables: string | null;
  monthly_value: string | number | null;
  implementation_value: string | number | null;
  implementation_days: number | null;
  database_cost: string | number | null;
  database_quantity: number | null;
  base_price_reference: string | number | null;
  discount_percent: string | number | null;
  payment_method: string | null;
  installments_count: number | null;
  installment_due_days: number[] | null;
  payment_terms: unknown;
  included_users: number | null;
  additional_users: number | null;
  additional_user_amount: string | number | null;
  hosted_by_automy: boolean | null;
  custom_url_enabled: boolean | null;
  loyalty_months: number | null;
  currency: string | null;
  starts_at: string | null;
  ends_at: string | null;
  renewal_at: string | null;
  billing_period: string | null;
  status: string;
  signer_name: string | null;
  signer_document: string | null;
  signer_email: string | null;
  signer_phone: string | null;
  automy_representative: string | null;
  witness_name: string | null;
  witness_document: string | null;
  contract_text: string | null;
  contract_hash: string | null;
  contract_version: number | null;
  signature_status: string | null;
  signed_document_path: string | null;
  product_name: string | null;
  product_version: string | null;
  client_trade_name: string | null;
  client_legal_name: string | null;
  client_document: string | null;
  company_trade_name: string | null;
  company_legal_name: string | null;
  company_city: string | null;
};

const createTicketSchema = z.object({
  subject: z.string().trim().min(2).max(180),
  category: z.enum(["Suporte", "Financeiro", "Contrato", "Comercial", "Outro"]),
  description: z.string().trim().min(2).max(10_000),
});

const replySchema = z.object({ body: z.string().trim().min(1).max(10_000) });
const profileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40),
});
const activationSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8).max(128),
});

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function mapContractStatus(status: unknown) {
  const value = asString(status).toLowerCase();
  if (value === "active") return "Ativo" as const;
  if (value === "onboarding") return "Implantação" as const;
  if (value === "renewal") return "Renovação" as const;
  if (value === "suspended") return "Suspenso" as const;
  if (value === "cancelled" || value === "canceled") return "Cancelado" as const;
  if (value === "ended" || value === "inactive") return "Encerrado" as const;
  return "Pendente" as const;
}

function mapSignatureStatus(status: unknown) {
  const value = asString(status).toLowerCase();
  if (value === "sent") return "Enviado para assinatura" as const;
  if (value === "signed") return "Assinado" as const;
  if (value === "cancelled" || value === "canceled") return "Cancelado" as const;
  return "Rascunho" as const;
}

function mapChargeStatus(status: unknown, dueDate: unknown) {
  const value = asString(status).toLowerCase();
  if (value === "paid") return "Pago" as const;
  if (value === "canceled" || value === "cancelled" || value === "failed")
    return "Cancelado" as const;
  if (value === "overdue") return "Vencido" as const;
  const due = asString(dueDate);
  if (due) {
    const today = new Date().toISOString().slice(0, 10);
    if (due.slice(0, 10) < today) return "Vencido" as const;
  }
  return "Em aberto" as const;
}

function mapTicketStatus(status: unknown) {
  const value = asString(status);
  if (value === "Em andamento") return "Em atendimento" as const;
  if (value === "Aguardando") return "Aguardando cliente" as const;
  if (value === "Resolvido") return "Resolvido" as const;
  if (value === "Fechado" || value === "Cancelado") return "Fechado" as const;
  return "Aberto" as const;
}

function mapTicketPriority(priority: unknown) {
  const value = asString(priority);
  if (value === "Crítica" || value === "Critica") return "Crítica" as const;
  if (value === "Alta") return "Alta" as const;
  if (value === "Baixa") return "Baixa" as const;
  return "Normal" as const;
}

function formatAddress(row: Record<string, unknown> | undefined) {
  if (!row) return "";
  const street = asString(row["street"]);
  const number = asString(row["number"]);
  const complement = asString(row["complement"]);
  const district = asString(row["district"]);
  const city = asString(row["city"]);
  const state = asString(row["state"]);
  const postalCode = asString(row["postal_code"]);
  const firstLine = [street, number].filter(Boolean).join(", ");
  const secondLine = [complement, district].filter(Boolean).join(" - ");
  const thirdLine = [city, state].filter(Boolean).join(" - ");
  return [firstLine, secondLine, thirdLine, postalCode].filter(Boolean).join(" · ");
}

function contractReference(id: string) {
  return `CTR-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function requirePortalUser(request: Request): Promise<PortalAuthResult> {
  const session = await getBetterAuthSessionFromRequest(request);
  const authUserId = session?.user.id;
  if (!authUserId) {
    return { error: portalJson({ error: "Sessão inválida ou expirada." }, { status: 401 }) };
  }

  if (!isRailwayPostgresConfigured()) {
    return { error: portalJson({ error: "Banco Railway não configurado." }, { status: 503 }) };
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query<PortalUserRow>(
    `
      select
        portal.id as portal_user_id,
        portal.company_id,
        portal.client_id,
        portal.name,
        auth_user.email,
        portal.phone,
        portal.role,
        portal.status as portal_status,
        auth_user.status as auth_status,
        clients.status as client_status
      from public.client_portal_users portal
      join public."user" auth_user
        on auth_user.id = portal.auth_user_id
        and auth_user.deleted_at is null
      join public.clients
        on clients.id = portal.client_id
        and clients.company_id = portal.company_id
        and clients.deleted_at is null
      where portal.auth_user_id = $1
        and portal.deleted_at is null
        and not exists (
          select 1
          from public.users internal_user
          where internal_user.auth_user_id = auth_user.id
            and internal_user.deleted_at is null
        )
      limit 1
    `,
    [authUserId],
  );

  const row = result.rows[0];
  if (!row) {
    return {
      error: portalJson(
        { error: "Usuário não está vinculado a um cliente do Portal." },
        { status: 403 },
      ),
    };
  }
  if (
    row.portal_status !== "active" ||
    row.auth_status !== "active" ||
    row.client_status === "blocked"
  ) {
    return { error: portalJson({ error: "Acesso ao Portal está inativo." }, { status: 403 }) };
  }

  return {
    context: {
      authUserId,
      portalUserId: row.portal_user_id,
      companyId: row.company_id,
      clientId: row.client_id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      role: row.role,
    },
  };
}

async function loadContract(db: Queryable, context: PortalContext, contractId?: string) {
  const values: unknown[] = [context.companyId, context.clientId];
  let idClause = "";
  if (contractId) {
    values.push(contractId);
    idClause = "and contracts.id = $3::uuid";
  }

  const result = await db.query<ContractRow>(
    `
      select
        contracts.*,
        products.name as product_name,
        products.version as product_version,
        clients.trade_name as client_trade_name,
        clients.legal_name as client_legal_name,
        clients.document as client_document,
        companies.trade_name as company_trade_name,
        companies.legal_name as company_legal_name,
        companies.city as company_city
      from public.contracts
      join public.clients
        on clients.id = contracts.client_id
        and clients.company_id = contracts.company_id
        and clients.deleted_at is null
      join public.companies
        on companies.id = contracts.company_id
        and companies.deleted_at is null
      left join public.products
        on products.id = contracts.product_id
        and products.company_id = contracts.company_id
        and products.deleted_at is null
      where contracts.company_id = $1
        and contracts.client_id = $2
        and contracts.deleted_at is null
        ${idClause}
      order by
        case contracts.status
          when 'active' then 1
          when 'onboarding' then 2
          when 'renewal' then 3
          when 'pending' then 4
          else 5
        end,
        contracts.updated_at desc
      limit 1
    `,
    values,
  );
  return result.rows[0];
}

function mapContract(row: ContractRow | undefined) {
  if (!row) return null;
  const paymentTerms = asObject(row.payment_terms);
  const loyaltyMonths = asNumber(row.loyalty_months);
  const canRenderPdf = Boolean(row.contract_text && row.contract_hash);
  return {
    id: row.id,
    reference: contractReference(row.id),
    status: mapContractStatus(row.status),
    product: row.product_name ?? row.name ?? "Serviço Automy",
    version: row.product_version ?? "",
    startDate: row.starts_at ?? "",
    endDate: row.ends_at ?? "",
    signatureStatus: mapSignatureStatus(row.signature_status),
    signedAt: null,
    term: loyaltyMonths > 0 ? `${loyaltyMonths} meses` : "Sem permanência mínima cadastrada",
    monthlyValue: asNumber(row.monthly_value),
    implementationValue: asNumber(row.implementation_value),
    paymentMethod: row.payment_method ?? "Não informado",
    paymentTerms: asString(paymentTerms["description"], "Condição não detalhada"),
    installmentsCount: Math.max(1, asNumber(row.installments_count, 1)),
    downPaymentAmount: asNumber(paymentTerms["downPaymentAmount"]),
    signer: row.signer_name ?? "Não informado",
    pdfUrl: canRenderPdf ? `/api/portal/v1/contracts/${row.id}/pdf` : null,
  };
}

async function loadTicket(db: Queryable, context: PortalContext, ticketNumber: string) {
  const result = await db.query<Record<string, unknown>>(
    `
      select
        tickets.id,
        tickets.ticket_number,
        tickets.title,
        tickets.category,
        tickets.priority,
        tickets.status,
        tickets.created_at,
        tickets.updated_at,
        coalesce(messages.items, '[]'::jsonb) as messages
      from public.support_tickets tickets
      left join lateral (
        select jsonb_agg(
          jsonb_build_object(
            'id', messages.id,
            'author', messages.author_name,
            'createdAt', messages.created_at,
            'body', messages.body
          ) order by messages.created_at asc
        ) as items
        from public.support_ticket_messages messages
        where messages.company_id = tickets.company_id
          and messages.ticket_id = tickets.id
          and messages.visibility = 'client'
          and messages.deleted_at is null
      ) messages on true
      where tickets.company_id = $1
        and tickets.client_id = $2
        and tickets.ticket_number = $3
        and tickets.deleted_at is null
      limit 1
    `,
    [context.companyId, context.clientId, ticketNumber],
  );
  return result.rows[0];
}

function mapTicket(row: Record<string, unknown>) {
  return {
    id: asString(row["ticket_number"]),
    subject: asString(row["title"]),
    category: asString(row["category"], "Outro"),
    status: mapTicketStatus(row["status"]),
    priority: mapTicketPriority(row["priority"]),
    createdAt: asString(row["created_at"]),
    updatedAt: asString(row["updated_at"]),
    messages: Array.isArray(row["messages"]) ? row["messages"] : [],
  };
}

async function handleSnapshot(context: PortalContext) {
  const db = await getRailwayPostgresPool();
  const [customerResult, contactResult, addressResult, contract, chargeResult, ticketResult] =
    await Promise.all([
      db.query<Record<string, unknown>>(
        `
        select id, legal_name, trade_name, document, city, state, owner_name
        from public.clients
        where company_id = $1 and id = $2 and deleted_at is null
        limit 1
      `,
        [context.companyId, context.clientId],
      ),
      db.query<Record<string, unknown>>(
        `
        select name, email, phone
        from public.contacts
        where company_id = $1 and client_id = $2 and deleted_at is null
        order by is_primary desc, created_at asc
        limit 1
      `,
        [context.companyId, context.clientId],
      ),
      db.query<Record<string, unknown>>(
        `
        select street, number, complement, district, city, state, postal_code
        from public.addresses
        where company_id = $1 and client_id = $2 and deleted_at is null
        order by created_at asc
        limit 1
      `,
        [context.companyId, context.clientId],
      ),
      loadContract(db, context),
      db.query<Record<string, unknown>>(
        `
        select id, invoice, reference, description, due_date, amount, method, status, payload
        from public.charges
        where company_id = $1
          and client_id = $2
          and deleted_at is null
        order by due_date asc nulls last, created_at asc
        limit 200
      `,
        [context.companyId, context.clientId],
      ),
      db.query<Record<string, unknown>>(
        `
        select
          tickets.id,
          tickets.ticket_number,
          tickets.title,
          tickets.category,
          tickets.priority,
          tickets.status,
          tickets.created_at,
          tickets.updated_at,
          coalesce(messages.items, '[]'::jsonb) as messages
        from public.support_tickets tickets
        left join lateral (
          select jsonb_agg(
            jsonb_build_object(
              'id', messages.id,
              'author', messages.author_name,
              'createdAt', messages.created_at,
              'body', messages.body
            ) order by messages.created_at asc
          ) as items
          from public.support_ticket_messages messages
          where messages.company_id = tickets.company_id
            and messages.ticket_id = tickets.id
            and messages.visibility = 'client'
            and messages.deleted_at is null
        ) messages on true
        where tickets.company_id = $1
          and tickets.client_id = $2
          and tickets.deleted_at is null
        order by tickets.updated_at desc
        limit 200
      `,
        [context.companyId, context.clientId],
      ),
    ]);

  const customer = customerResult.rows[0];
  if (!customer) return portalJson({ error: "Cliente não encontrado." }, { status: 404 });
  const contact = contactResult.rows[0];
  const address = addressResult.rows[0];
  const installments = chargeResult.rows.map((row) => ({
    id: asString(row["id"]),
    description:
      asString(row["description"]) ||
      asString(row["reference"]) ||
      asString(row["invoice"], "Cobrança"),
    dueDate: asString(row["due_date"]),
    value: asNumber(row["amount"]),
    status: mapChargeStatus(row["status"], row["due_date"]),
    paymentMethod: asString(row["method"], "Não informado"),
    // Do not surface provider payload URLs until the billing provider contract is formally mapped.
    paymentUrl: null,
  }));
  const openInstallments = installments.filter(
    (item) => item.status === "Em aberto" || item.status === "Vencido",
  );
  const next =
    openInstallments
      .filter((item) => item.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;

  return portalJson({
    customer: {
      id: asString(customer["id"]),
      legalName: asString(customer["legal_name"]),
      tradeName: asString(customer["trade_name"]) || asString(customer["legal_name"]),
      document: asString(customer["document"]),
      email: asString(contact?.["email"]),
      phone: asString(contact?.["phone"]),
      address: formatAddress(address),
      accountManager: asString(customer["owner_name"]),
    },
    user: {
      id: context.portalUserId,
      name: context.name,
      email: context.email,
      phone: context.phone,
      role: context.role,
    },
    contract: mapContract(contract),
    finance: {
      nextDueDate: next?.dueDate ?? null,
      nextValue: next?.value ?? null,
      openAmount: openInstallments.reduce((total, item) => total + item.value, 0),
      installments,
    },
    tickets: ticketResult.rows.map(mapTicket),
  });
}

async function recordPortalAudit(
  db: Queryable,
  context: PortalContext,
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
      values ($1, $2, null, $3, $4, $5::uuid, $6, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(metadata),
    ],
  );
}

async function handleCreateTicket(request: Request, context: PortalContext) {
  const parsed = createTicketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return portalJson({ error: "Preencha assunto, categoria e descrição." }, { status: 400 });
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const result = await client.query<{ id: string; ticket_number: string }>(
      `
        insert into public.support_tickets (
          company_id, ticket_number, client_id, client_name, title, description,
          category, priority, status, source, tags, created_by, updated_by
        )
        select
          $1,
          concat('TCK-', to_char(now(), 'YYYYMMDDHH24MISS'), '-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
          clients.id,
          coalesce(clients.trade_name, clients.legal_name),
          $3, $4, $5, 'Média', 'Aberto', 'portal', '[]'::jsonb, $6, $6
        from public.clients
        where clients.company_id = $1
          and clients.id = $2
          and clients.deleted_at is null
        returning id, ticket_number
      `,
      [
        context.companyId,
        context.clientId,
        parsed.data.subject,
        parsed.data.description,
        parsed.data.category,
        context.authUserId,
      ],
    );
    const created = result.rows[0];
    if (!created) {
      await client.query("rollback");
      return portalJson({ error: "Cliente não encontrado." }, { status: 404 });
    }
    await client.query(
      `
        insert into public.support_ticket_messages (
          company_id, ticket_id, author_user_id, author_name, body, visibility, created_by, updated_by
        )
        values ($1, $2, null, $3, $4, 'client', $5, $5)
      `,
      [context.companyId, created.id, context.name, parsed.data.description, context.authUserId],
    );
    await client.query(
      `
        insert into public.support_ticket_events (
          company_id, ticket_id, actor_user_id, event_type, metadata, created_by, updated_by
        ) values ($1, $2, null, 'ticket.portal.create', $3, $4, $4)
      `,
      [
        context.companyId,
        created.id,
        JSON.stringify({ portalUserId: context.portalUserId }),
        context.authUserId,
      ],
    );
    await recordPortalAudit(client, context, "ticket.portal.create", "support_ticket", created.id, {
      clientId: context.clientId,
    });
    await client.query("commit");
    const row = await loadTicket(db, context, created.ticket_number);
    if (!row)
      return portalJson(
        { error: "Ticket criado, mas não foi possível recarregá-lo." },
        { status: 500 },
      );
    return portalJson(mapTicket(row), { status: 201 });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleReplyTicket(request: Request, context: PortalContext, ticketNumber: string) {
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return portalJson({ error: "Informe uma mensagem." }, { status: 400 });
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const ticketResult = await client.query<{ id: string }>(
      `
        update public.support_tickets
        set status = case when status = 'Aguardando' then 'Em andamento' else status end,
            updated_at = now(),
            updated_by = $4
        where company_id = $1
          and client_id = $2
          and ticket_number = $3
          and deleted_at is null
          and status not in ('Fechado', 'Cancelado')
        returning id
      `,
      [context.companyId, context.clientId, ticketNumber, context.authUserId],
    );
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      await client.query("rollback");
      return portalJson({ error: "Chamado não encontrado ou já encerrado." }, { status: 404 });
    }
    await client.query(
      `
        insert into public.support_ticket_messages (
          company_id, ticket_id, author_user_id, author_name, body, visibility, created_by, updated_by
        ) values ($1, $2, null, $3, $4, 'client', $5, $5)
      `,
      [context.companyId, ticket.id, context.name, parsed.data.body, context.authUserId],
    );
    await client.query(
      `
        insert into public.support_ticket_events (
          company_id, ticket_id, actor_user_id, event_type, metadata, created_by, updated_by
        ) values ($1, $2, null, 'ticket.portal.reply', $3, $4, $4)
      `,
      [
        context.companyId,
        ticket.id,
        JSON.stringify({ portalUserId: context.portalUserId }),
        context.authUserId,
      ],
    );
    await recordPortalAudit(client, context, "ticket.portal.reply", "support_ticket", ticket.id, {
      clientId: context.clientId,
    });
    await client.query("commit");
    const row = await loadTicket(db, context, ticketNumber);
    if (!row) return portalJson({ error: "Chamado não encontrado." }, { status: 404 });
    return portalJson(mapTicket(row));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateProfile(request: Request, context: PortalContext) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return portalJson({ error: "Nome ou telefone inválido." }, { status: 400 });
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const result = await client.query<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
    }>(
      `
        update public.client_portal_users
        set name = $3,
            phone = nullif($4, ''),
            updated_at = now(),
            updated_by = $5
        where id = $1 and auth_user_id = $2 and deleted_at is null
        returning id, name, email, phone, role
      `,
      [
        context.portalUserId,
        context.authUserId,
        parsed.data.name,
        parsed.data.phone,
        context.authUserId,
      ],
    );
    const user = result.rows[0];
    if (!user) {
      await client.query("rollback");
      return portalJson({ error: "Perfil não encontrado." }, { status: 404 });
    }
    await client.query(
      `update public."user" set name = $2, "updatedAt" = now() where id = $1 and deleted_at is null`,
      [context.authUserId, parsed.data.name],
    );
    await recordPortalAudit(client, context, "portal.profile.update", "client", context.clientId, {
      fields: ["name", "phone"],
    });
    await client.query("commit");
    return portalJson({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      },
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function loadContractItems(
  db: Queryable,
  context: PortalContext,
  contractId: string,
): Promise<ContractPdfItem[]> {
  const result = await db.query<Record<string, unknown>>(
    `
      select name, quantity, monthly_value
      from public.contract_items
      where company_id = $1 and contract_id = $2 and deleted_at is null
      order by created_at asc
    `,
    [context.companyId, contractId],
  );
  return result.rows.map((row) => ({
    name: asString(row["name"], "Item contratado"),
    quantity: asNumber(row["quantity"], 1),
    monthlyValue: asNumber(row["monthly_value"]),
  }));
}

async function handleContractPdf(request: Request, context: PortalContext, contractId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contractId)
  ) {
    return portalJson({ error: "Contrato inválido." }, { status: 400 });
  }
  const db = await getRailwayPostgresPool();
  const row = await loadContract(db, context, contractId);
  if (!row) return portalJson({ error: "Contrato não encontrado." }, { status: 404 });
  if (!row.contract_text || !row.contract_hash) {
    return portalJson(
      { error: "Documento oficial ainda não está preparado no ERP." },
      { status: 409 },
    );
  }

  try {
    const paymentTerms = asObject(row.payment_terms);
    validateContractConsistency({
      snapshot: {
        monthlyValue: asNumber(row.monthly_value),
        implementationValue: asNumber(row.implementation_value),
        implementationDays: asNumber(row.implementation_days),
        basePriceReference: asNumber(row.base_price_reference),
        additionalUserAmount: asNumber(row.additional_user_amount),
        databaseCost: asNumber(row.database_cost),
        downPaymentAmount: asNumber(paymentTerms["downPaymentAmount"]),
        includedUsers: asNumber(row.included_users, 1),
        hostedByAutomy: Boolean(row.hosted_by_automy ?? true),
        customUrlEnabled: Boolean(row.custom_url_enabled ?? false),
        paymentMethod: row.payment_method,
        installmentsCount: asNumber(row.installments_count, 1),
        installmentDueDays: row.installment_due_days ?? [],
        paymentTerms: row.payment_terms ?? {},
        loyaltyMonths: asNumber(row.loyalty_months),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        renewalAt: row.renewal_at,
      },
      contractText: row.contract_text,
    });

    const items = await loadContractItems(db, context, row.id);
    const pdf = await generateContractPdf({
      id: row.id,
      version: asNumber(row.contract_version, 1),
      hash: row.contract_hash,
      generatedAt: new Date().toISOString(),
      companyName: row.company_trade_name ?? row.company_legal_name ?? "Automy",
      contractSigningCity: row.company_city ?? "",
      clientName: row.client_trade_name ?? row.client_legal_name ?? "Cliente",
      clientDocument: row.client_document ?? "",
      productName: row.product_name ?? "Produto",
      plan: row.name ?? "Contrato Automy",
      status: row.status,
      description: row.description,
      scope: row.scope,
      deliverables: row.deliverables,
      includedUsers: asNumber(row.included_users, 1),
      hostedByAutomy: Boolean(row.hosted_by_automy ?? true),
      customUrlEnabled: Boolean(row.custom_url_enabled ?? false),
      implementationDays: asNumber(row.implementation_days),
      databaseCost: asNumber(row.database_cost),
      databaseQuantity: asNumber(row.database_quantity),
      basePriceReference: asNumber(row.base_price_reference),
      discountPercent: asNumber(row.discount_percent),
      paymentMethod: row.payment_method ?? "Boleto",
      billingPeriod: row.billing_period ?? "Mensal",
      installmentsCount: asNumber(row.installments_count, 1),
      installmentDueDays: row.installment_due_days ?? [],
      paymentTerms: row.payment_terms ?? {},
      paymentTermsDescription: asString(paymentTerms["description"]),
      loyaltyMonths: asNumber(row.loyalty_months),
      monthlyValue: asNumber(row.monthly_value),
      implementationValue: asNumber(row.implementation_value),
      startsAt: row.starts_at ?? "",
      endsAt: row.ends_at ?? "",
      renewalAt: row.renewal_at ?? "",
      signerName: row.signer_name ?? "",
      signerDocument: row.signer_document ?? "",
      signerEmail: row.signer_email ?? "",
      signerPhone: row.signer_phone ?? "",
      automyRepresentative: row.automy_representative ?? "",
      witnessName: row.witness_name ?? "",
      witnessDocument: row.witness_document ?? "",
      items,
      contractText: row.contract_text,
      brandAssets: loadContractPdfBrandAssets(),
    });

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(new Uint8Array(pdf), {
      headers: contractPdfHeaders(row.id, download ? "attachment" : "inline"),
    });
  } catch (error) {
    if (error instanceof ContractConsistencyError) {
      console.error("Portal bloqueou PDF inconsistente:", error.details);
      return portalJson(
        { error: "O documento precisa ser revisado no ERP antes de ser exibido." },
        { status: 409 },
      );
    }
    console.error("Falha ao gerar PDF read-only do Portal:", error);
    return portalJson({ error: "Não foi possível gerar o documento." }, { status: 500 });
  }
}

function matchTicketNumber(pathname: string, suffix = "") {
  const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = pathname.match(new RegExp(`^/api/portal/v1/tickets/([^/]+)${escaped}$`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function matchContractPdf(pathname: string) {
  const match = pathname.match(/^\/api\/portal\/v1\/contracts\/([^/]+)\/pdf$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function handleVerifyActivation(url: URL) {
  const token = url.searchParams.get("token") ?? "";
  const result = await verifyPortalActivationToken(token);
  if (result.status === "valid") return portalJson(result);
  if (result.status === "expired") {
    return portalJson(
      { status: "expired", error: "Este convite expirou. Solicite um novo acesso à Automy." },
      { status: 410 },
    );
  }
  if (result.status === "used") {
    return portalJson({ status: "used", error: "Este convite já foi utilizado." }, { status: 409 });
  }
  return portalJson({ status: "invalid", error: "Convite inválido." }, { status: 400 });
}

async function handleCompleteActivation(request: Request) {
  const parsed = activationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return portalJson({ error: "Convite ou senha inválidos." }, { status: 400 });
  }

  const result = await activatePortalInvitation(parsed.data.token, parsed.data.password);
  if (result.status === "activated") return portalJson({ ok: true });
  if (result.status === "expired") {
    return portalJson(
      { error: "Este convite expirou. Solicite um novo acesso à Automy." },
      { status: 410 },
    );
  }
  if (result.status === "used") {
    return portalJson({ error: "Este convite já foi utilizado." }, { status: 409 });
  }
  return portalJson({ error: "Convite inválido." }, { status: 400 });
}

export async function handlePortalApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/portal/v1/")) return null;

  if (request.method === "GET" && url.pathname === "/api/portal/v1/activation") {
    return handleVerifyActivation(url);
  }
  if (request.method === "POST" && url.pathname === "/api/portal/v1/activation") {
    return handleCompleteActivation(request);
  }

  const auth = await requirePortalUser(request);
  if (auth.error) return auth.error;
  const { context } = auth;

  if (request.method === "GET" && url.pathname === "/api/portal/v1/me") {
    return handleSnapshot(context);
  }
  if (request.method === "POST" && url.pathname === "/api/portal/v1/tickets") {
    return handleCreateTicket(request, context);
  }
  const messageTicket = matchTicketNumber(url.pathname, "/messages");
  if (request.method === "POST" && messageTicket) {
    return handleReplyTicket(request, context, messageTicket);
  }
  const ticketNumber = matchTicketNumber(url.pathname);
  if (request.method === "GET" && ticketNumber) {
    const db = await getRailwayPostgresPool();
    const row = await loadTicket(db, context, ticketNumber);
    if (!row) return portalJson({ error: "Chamado não encontrado." }, { status: 404 });
    return portalJson(mapTicket(row));
  }
  if (request.method === "PATCH" && url.pathname === "/api/portal/v1/profile") {
    return handleUpdateProfile(request, context);
  }
  const contractId = matchContractPdf(url.pathname);
  if (request.method === "GET" && contractId) {
    return handleContractPdf(request, context, contractId);
  }

  return portalJson({ error: "Rota do Portal não encontrada." }, { status: 404 });
}

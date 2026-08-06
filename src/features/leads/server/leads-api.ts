import { createHash } from "node:crypto";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import {
  jsonResponse,
  requireAuthenticatedUser,
  requirePermission,
  type AuthenticatedUserContext,
} from "@/shared/server/authz";
import {
  leadConvertSchema,
  leadListQuerySchema,
  leadUpdateSchema,
  publicLeadSchema,
  type LeadListQuery,
  type PublicLeadInput,
} from "@/features/leads/validation";
import type { Lead, LeadStatus } from "@/features/leads/types";
import type { QueryResultRow } from "pg";

const PUBLIC_LEADS_PATH = "/api/public/leads";
const LEADS_PATH = "/api/leads";
const LEADS_CONVERT_PATH = "/api/leads/convert";
const requestRateLimit = new Map<string, { resetAt: number; count: number }>();

type QueryableConnection = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
};

type LeadRow = QueryResultRow & {
  id: string;
  company_id: string | null;
  name: string;
  company_name: string;
  email: string;
  phone: string | null;
  document: string | null;
  message: string | null;
  interest: string | null;
  source: string;
  status: LeadStatus;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_path: string | null;
  referrer: string | null;
  consent_at: string;
  first_contact_at: string | null;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone ?? "",
    document: row.document ?? "",
    message: row.message ?? "",
    interest: row.interest ?? "",
    source: row.source,
    status: row.status,
    assignedUserId: row.assigned_user_id,
    assignedUserName: row.assigned_user_name ?? "",
    utmSource: row.utm_source ?? "",
    utmMedium: row.utm_medium ?? "",
    utmCampaign: row.utm_campaign ?? "",
    utmContent: row.utm_content ?? "",
    utmTerm: row.utm_term ?? "",
    landingPath: row.landing_path ?? "",
    referrer: row.referrer ?? "",
    consentAt: row.consent_at,
    firstContactAt: row.first_contact_at,
    convertedClientId: row.converted_client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function publicCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = new Set(
    (
      process.env["AUTOMY_PUBLIC_LEAD_ORIGINS"] ??
      "https://automy.dev.br,https://www.automy.dev.br,http://localhost:3000,http://localhost:5173"
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  if (!origin || !allowed.has(origin)) return {};

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function hashIp(ip: string) {
  const salt = process.env["BETTER_AUTH_SECRET"] ?? "automy-public-leads";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function assertPublicRateLimit(request: Request) {
  const key = hashIp(clientIp(request));
  const now = Date.now();
  const current = requestRateLimit.get(key);
  if (!current || current.resetAt < now) {
    requestRateLimit.set(key, { resetAt: now + 15 * 60_000, count: 1 });
    return;
  }

  if (current.count >= Number(process.env["AUTOMY_PUBLIC_LEADS_RATE_LIMIT"] ?? 8)) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  current.count += 1;
}

async function verifyTurnstileIfConfigured(input: PublicLeadInput) {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return;
  if (!input.turnstileToken) throw new Error("Validação anti-spam não informada.");

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: input.turnstileToken,
    }),
  });
  const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!payload?.success) throw new Error("Não foi possível validar o envio.");
}

async function resolveInstitutionalCompanyId() {
  const db = await getRailwayPostgresPool();
  const result = await db.query<{ id: string }>(
    `
      select id
      from public.companies
      where deleted_at is null
        and status = 'active'
      order by created_at asc
      limit 1
    `,
  );
  return result.rows[0]?.id ?? null;
}

async function recordLeadAudit(
  db: QueryableConnection,
  companyId: string | null,
  action: string,
  leadId: string,
  metadata: Record<string, unknown>,
  context?: AuthenticatedUserContext,
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
      values ($1, $2, $3, $4, 'lead', $5, $6, $2, $2)
    `,
    [
      companyId,
      context?.authUserId ?? null,
      context?.domainUserId ?? null,
      action,
      leadId,
      JSON.stringify(metadata),
    ],
  );
}

async function createLeadNotification(
  db: QueryableConnection,
  companyId: string | null,
  leadId: string,
  input: Pick<PublicLeadInput, "company" | "name" | "email">,
) {
  if (!companyId) return;

  await db.query(
    `
      insert into public.notifications (
        company_id,
        auth_user_id,
        title,
        description,
        type,
        status,
        related_entity_type,
        related_entity_id,
        href
      )
      select
        $1,
        users.auth_user_id,
        'Novo lead recebido',
        $2,
        'info',
        'unread',
        'lead',
        $3,
        '/leads'
      from public.users
      join public.roles on roles.id = users.role_id and roles.deleted_at is null
      where users.company_id = $1
        and users.auth_user_id is not null
        and users.status = 'active'
        and users.deleted_at is null
        and roles.key in ('admin', 'manager')
    `,
    [companyId, `${input.company} · ${input.name} · ${input.email}`, leadId],
  );
}

async function handleCreatePublicLead(request: Request) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse(
      { error: "Canal de recebimento indisponível no momento." },
      { status: 503, headers: publicCorsHeaders(request) },
    );
  }

  const headers = publicCorsHeaders(request);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 25_000) {
    return jsonResponse({ error: "Solicitação muito grande." }, { status: 413, headers });
  }

  try {
    assertPublicRateLimit(request);
    const payload = await request.json().catch(() => null);
    if (
      payload &&
      typeof payload === "object" &&
      "website" in payload &&
      String(payload.website ?? "").trim()
    ) {
      return jsonResponse({ ok: true }, { status: 202, headers });
    }

    const parsed = publicLeadSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Dados inválidos. Revise os campos obrigatórios." },
        { status: 400, headers },
      );
    }

    if (parsed.data.website) return jsonResponse({ ok: true }, { status: 202, headers });
    await verifyTurnstileIfConfigured(parsed.data);

    const db = await getRailwayPostgresPool();
    const companyId = await resolveInstitutionalCompanyId();
    const landingPath = parsed.data.landingPath || parsed.data.source_page;
    const source = parsed.data.source || "landing";
    const interest = parsed.data.interest || parsed.data.challenge;
    const ipHash = hashIp(clientIp(request));
    const existing = await db.query<{ id: string }>(
      `
        select id
        from public.leads
        where lower(email) = lower($1)
          and lower(company_name) = lower($2)
          and source = $3
          and status not in ('converted', 'discarded', 'lost')
          and deleted_at is null
        order by created_at desc
        limit 1
      `,
      [parsed.data.email, parsed.data.company, source],
    );

    const existingId = existing.rows[0]?.id;
    const metadata = {
      gclid: parsed.data.gclid || null,
      fbclid: parsed.data.fbclid || null,
    };

    const result = existingId
      ? await db.query<{ id: string }>(
          `
            update public.leads
            set
              phone = $2,
              document = nullif($3, ''),
              message = nullif($4, ''),
              interest = nullif($5, ''),
              landing_path = nullif($6, ''),
              referrer = nullif($7, ''),
              utm_source = nullif($8, ''),
              utm_medium = nullif($9, ''),
              utm_campaign = nullif($10, ''),
              utm_content = nullif($11, ''),
              utm_term = nullif($12, ''),
              metadata = $13,
              updated_at = now()
            where id = $1
            returning id
          `,
          [
            existingId,
            parsed.data.phone,
            parsed.data.document,
            parsed.data.message,
            interest,
            landingPath,
            parsed.data.referrer,
            parsed.data.utmSource || parsed.data.utm_source,
            parsed.data.utmMedium || parsed.data.utm_medium,
            parsed.data.utmCampaign || parsed.data.utm_campaign,
            parsed.data.utmContent || parsed.data.utm_content,
            parsed.data.utmTerm || parsed.data.utm_term,
            JSON.stringify(metadata),
          ],
        )
      : await db.query<{ id: string }>(
          `
            insert into public.leads (
              company_id,
              name,
              company_name,
              email,
              phone,
              document,
              message,
              interest,
              source,
              utm_source,
              utm_medium,
              utm_campaign,
              utm_content,
              utm_term,
              landing_path,
              referrer,
              consent_at,
              ip_hash,
              user_agent,
              metadata
            )
            values ($1, $2, $3, $4, $5, nullif($6, ''), nullif($7, ''), nullif($8, ''), $9, nullif($10, ''), nullif($11, ''), nullif($12, ''), nullif($13, ''), nullif($14, ''), nullif($15, ''), nullif($16, ''), now(), $17, $18, $19)
            returning id
          `,
          [
            companyId,
            parsed.data.name,
            parsed.data.company,
            parsed.data.email,
            parsed.data.phone,
            parsed.data.document,
            parsed.data.message,
            interest,
            source,
            parsed.data.utmSource || parsed.data.utm_source,
            parsed.data.utmMedium || parsed.data.utm_medium,
            parsed.data.utmCampaign || parsed.data.utm_campaign,
            parsed.data.utmContent || parsed.data.utm_content,
            parsed.data.utmTerm || parsed.data.utm_term,
            landingPath,
            parsed.data.referrer,
            ipHash,
            request.headers.get("user-agent") ?? null,
            JSON.stringify(metadata),
          ],
        );

    const leadId = result.rows[0]?.id;
    if (leadId) {
      await recordLeadAudit(
        db,
        companyId,
        existingId ? "lead.update.public" : "lead.create.public",
        leadId,
        {
          source,
          deduplicated: Boolean(existingId),
        },
      );
      await createLeadNotification(db, companyId, leadId, parsed.data);
    }

    return jsonResponse({ ok: true }, { status: 201, headers });
  } catch {
    return jsonResponse(
      { error: "Não foi possível registrar sua solicitação agora." },
      { status: 400, headers },
    );
  }
}

function paramsFromUrl(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}

async function listLeads(url: URL, context: AuthenticatedUserContext) {
  const parsed = leadListQuerySchema.safeParse(paramsFromUrl(url));
  if (!parsed.success) {
    return jsonResponse({ error: "Filtros inválidos." }, { status: 400 });
  }

  const data: LeadListQuery = parsed.data;
  const offset = (data.page - 1) * data.pageSize;
  const values: unknown[] = [
    context.companyId,
    data.status,
    `%${data.search}%`,
    data.pageSize,
    offset,
  ];
  const db = await getRailwayPostgresPool();
  const count = await db.query<{ total: string }>(
    `
      select count(*)::text as total
      from public.leads
      left join public.users assigned on assigned.id = leads.assigned_user_id
      where leads.deleted_at is null
        and (leads.company_id = $1 or leads.company_id is null)
        and ($2 = 'all' or leads.status = $2)
        and (
          $3 = '%%'
          or leads.name ilike $3
          or leads.company_name ilike $3
          or leads.email ilike $3
          or coalesce(leads.document, '') ilike $3
          or coalesce(assigned.name, '') ilike $3
        )
    `,
    values.slice(0, 3),
  );
  const result = await db.query<LeadRow>(
    `
      select leads.*, assigned.name as assigned_user_name
      from public.leads
      left join public.users assigned
        on assigned.id = leads.assigned_user_id
        and assigned.deleted_at is null
      where leads.deleted_at is null
        and (leads.company_id = $1 or leads.company_id is null)
        and ($2 = 'all' or leads.status = $2)
        and (
          $3 = '%%'
          or leads.name ilike $3
          or leads.company_name ilike $3
          or leads.email ilike $3
          or coalesce(leads.document, '') ilike $3
          or coalesce(assigned.name, '') ilike $3
        )
      order by leads.created_at desc
      limit $4
      offset $5
    `,
    values,
  );
  const total = Number(count.rows[0]?.total ?? 0);
  return jsonResponse({
    leads: result.rows.map(mapLead),
    total,
    page: data.page,
    pageSize: data.pageSize,
    pageCount: Math.max(1, Math.ceil(total / data.pageSize)),
  });
}

async function findLeadById(id: string, context: AuthenticatedUserContext) {
  const db = await getRailwayPostgresPool();
  const result = await db.query<LeadRow>(
    `
      select leads.*, assigned.name as assigned_user_name
      from public.leads
      left join public.users assigned on assigned.id = leads.assigned_user_id and assigned.deleted_at is null
      where leads.id = $1
        and leads.deleted_at is null
        and (leads.company_id = $2 or leads.company_id is null)
      limit 1
    `,
    [id, context.companyId],
  );
  return result.rows[0] ? mapLead(result.rows[0]) : null;
}

async function updateLead(request: Request, context: AuthenticatedUserContext) {
  const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  await db.query(
    `
      update public.leads
      set
        status = coalesce($3, status),
        assigned_user_id = case when $4::uuid is null then assigned_user_id else $4::uuid end,
        first_contact_at = coalesce($5::timestamptz, first_contact_at),
        company_id = coalesce(company_id, $2),
        updated_by = $6,
        updated_at = now()
      where id = $1
        and deleted_at is null
        and (company_id = $2 or company_id is null)
    `,
    [
      parsed.data.id,
      context.companyId,
      parsed.data.status ?? null,
      parsed.data.assignedUserId ?? null,
      parsed.data.firstContactAt ?? null,
      context.authUserId,
    ],
  );
  await recordLeadAudit(db, context.companyId, "lead.update", parsed.data.id, parsed.data, context);
  const lead = await findLeadById(parsed.data.id, context);
  return jsonResponse({ lead });
}

async function convertLead(request: Request, context: AuthenticatedUserContext) {
  const parsed = leadConvertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Lead inválido." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const leadResult = await client.query<LeadRow>(
      `
        select *
        from public.leads
        where id = $1
          and deleted_at is null
          and (company_id = $2 or company_id is null)
        for update
      `,
      [parsed.data.id, context.companyId],
    );
    const lead = leadResult.rows[0];
    if (!lead) {
      await client.query("rollback");
      return jsonResponse({ error: "Lead não encontrado." }, { status: 404 });
    }
    if (lead.converted_client_id) {
      await client.query("rollback");
      return jsonResponse({ error: "Lead já convertido." }, { status: 409 });
    }

    const created = await client.query<{ id: string }>(
      `
        insert into public.clients (
          company_id,
          legal_name,
          trade_name,
          document,
          email,
          phone,
          owner_name,
          status,
          notes,
          created_by,
          updated_by
        )
        values ($1, $2, $2, nullif($3, ''), $4, $5, $6, 'pending', $7, $8, $8)
        returning id
      `,
      [
        context.companyId,
        lead.company_name,
        lead.document ?? "",
        lead.email,
        lead.phone ?? "",
        lead.name,
        lead.message,
        context.authUserId,
      ],
    );
    const clientId = created.rows[0]?.id;
    if (!clientId) throw new Error("Cliente não foi criado.");

    await client.query(
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
        values ($1, $2, $3, $4, $5, 'Contato do lead', true, $6, $6)
      `,
      [context.companyId, clientId, lead.name, lead.email, lead.phone, context.authUserId],
    );
    await client.query(
      `
        update public.leads
        set status = 'converted',
            company_id = coalesce(company_id, $2),
            converted_client_id = $3,
            updated_by = $4,
            updated_at = now()
        where id = $1
      `,
      [lead.id, context.companyId, clientId, context.authUserId],
    );
    await recordLeadAudit(
      client,
      context.companyId,
      "lead.convert",
      lead.id,
      { clientId },
      context,
    );
    await client.query("commit");

    const updatedLead = await findLeadById(lead.id, context);
    return jsonResponse({ lead: updatedLead, clientId });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleLeadsApiRequest(request: Request) {
  const url = new URL(request.url);
  if (![PUBLIC_LEADS_PATH, LEADS_PATH, LEADS_CONVERT_PATH].includes(url.pathname)) return null;

  if (url.pathname === PUBLIC_LEADS_PATH && request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: publicCorsHeaders(request) });
  }

  if (url.pathname === PUBLIC_LEADS_PATH && request.method === "POST") {
    return handleCreatePublicLead(request);
  }

  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.error) return auth.error;

  if (url.pathname === LEADS_PATH && request.method === "GET") {
    const permission = requirePermission(auth.context, "leads.read");
    if (permission) return permission;
    return listLeads(url, auth.context);
  }

  if (url.pathname === LEADS_PATH && request.method === "PATCH") {
    const permission = requirePermission(auth.context, "leads.manage");
    if (permission) return permission;
    return updateLead(request, auth.context);
  }

  if (url.pathname === LEADS_CONVERT_PATH && request.method === "POST") {
    const permission = requirePermission(auth.context, "leads.manage");
    if (permission) return permission;
    return convertLead(request, auth.context);
  }

  return jsonResponse({ error: "Método não permitido." }, { status: 405 });
}

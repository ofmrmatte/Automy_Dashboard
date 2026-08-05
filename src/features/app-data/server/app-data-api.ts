import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import {
  jsonResponse,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
  type AuthenticatedUserContext,
  type PermissionKey,
} from "@/shared/server/authz";
import type { QueryResultRow } from "pg";

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
      select *
      from public.clients
      where deleted_at is null
        and company_id = $2
        and ($1::uuid is null or id = $1::uuid)
      order by created_at desc
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

  const payload = (await request.json()) as {
    tradeName?: unknown;
    legalName?: unknown;
    document?: unknown;
    city?: unknown;
    state?: unknown;
    owner?: unknown;
    plan?: unknown;
    status?: unknown;
  };
  const tradeName = typeof payload.tradeName === "string" ? payload.tradeName.trim() : "";
  const legalName =
    typeof payload.legalName === "string" && payload.legalName.trim()
      ? payload.legalName.trim()
      : tradeName;
  const document = typeof payload.document === "string" ? payload.document.trim() : "";

  if (!tradeName || !document) {
    return jsonResponse({ error: "Nome fantasia e CNPJ são obrigatórios." }, { status: 400 });
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      insert into public.clients (
        company_id,
        legal_name,
        trade_name,
        document,
        city,
        state,
        owner_name,
        plan_name,
        status,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      on conflict do nothing
      returning *
    `,
    [
      context.companyId,
      legalName,
      tradeName,
      document,
      typeof payload.city === "string" ? payload.city : "",
      typeof payload.state === "string" ? payload.state : "",
      typeof payload.owner === "string" ? payload.owner : "",
      typeof payload.plan === "string" ? payload.plan : "",
      mapClientStatusToDatabase(typeof payload.status === "string" ? payload.status : "pending"),
      context.domainUserId,
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Cliente já cadastrado para este CNPJ." }, { status: 409 });
  }

  return jsonResponse({ client: result.rows[0] }, { status: 201 });
}

function mapClientStatusToDatabase(status: string) {
  if (status === "Ativo" || status === "active") return "active";
  if (status === "Implantação" || status === "onboarding") return "onboarding";
  return "pending";
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
      count(contracts.id)::int as clients
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

  const payload = (await request.json()) as {
    name?: unknown;
    category?: unknown;
    version?: unknown;
    description?: unknown;
    commercialTerms?: unknown;
    contractTemplate?: unknown;
  };
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) return jsonResponse({ error: "Nome do produto é obrigatório." }, { status: 400 });

  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      insert into public.products (
        company_id,
        name,
        category,
        version,
        description,
        status,
        commercial_terms,
        contract_template,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $8)
      on conflict do nothing
      returning *, 0::int as clients
    `,
    [
      context.companyId,
      name,
      typeof payload.category === "string" ? payload.category : "Automação",
      typeof payload.version === "string" ? payload.version : "1.0",
      typeof payload.description === "string" ? payload.description : "",
      JSON.stringify(payload.commercialTerms ?? {}),
      typeof payload.contractTemplate === "string" ? payload.contractTemplate : "",
      context.domainUserId,
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto já cadastrado." }, { status: 409 });
  }

  return jsonResponse({ product: result.rows[0] }, { status: 201 });
}

async function handleUpdateProduct(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    id?: unknown;
    name?: unknown;
    category?: unknown;
    version?: unknown;
    status?: unknown;
  };
  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id) return jsonResponse({ error: "Produto não informado." }, { status: 400 });

  await ensureBusinessSchema();
  const db = await getRailwayPostgresPool();
  const result = await db.query(
    `
      update public.products
      set
        name = coalesce(nullif($3, ''), name),
        category = coalesce(nullif($4, ''), category),
        version = coalesce(nullif($5, ''), version),
        status = coalesce(nullif($6, ''), status),
        updated_by = $7,
        updated_at = now()
      where id = $1
        and company_id = $2
        and deleted_at is null
      returning *, 0::int as clients
    `,
    [
      id,
      context.companyId,
      typeof payload.name === "string" ? payload.name.trim() : "",
      typeof payload.category === "string" ? payload.category.trim() : "",
      typeof payload.version === "string" ? payload.version.trim() : "",
      mapProductStatusToDatabase(typeof payload.status === "string" ? payload.status : ""),
      context.domainUserId,
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  return jsonResponse({ product: result.rows[0] });
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
    [id, context.companyId, context.domainUserId],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  return jsonResponse({ ok: true });
}

function mapProductStatusToDatabase(status: string) {
  if (status === "Ativo" || status === "active") return "active";
  if (status === "Beta" || status === "beta") return "beta";
  if (status === "Descontinuando" || status === "discontinuing") return "discontinuing";
  return "";
}

async function handleCreateContract(request: Request, context: AuthenticatedUserContext) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    productId?: unknown;
    companyName?: unknown;
    document?: unknown;
    signerName?: unknown;
    hasWitness?: unknown;
    witnessName?: unknown;
    contractText?: unknown;
  };
  const productId = typeof payload.productId === "string" ? payload.productId : "";
  const companyName = typeof payload.companyName === "string" ? payload.companyName.trim() : "";
  const document = typeof payload.document === "string" ? payload.document.trim() : "";
  const signerName = typeof payload.signerName === "string" ? payload.signerName.trim() : "";
  const witnessName =
    payload.hasWitness && typeof payload.witnessName === "string" ? payload.witnessName.trim() : "";
  const contractText = typeof payload.contractText === "string" ? payload.contractText : "";

  if (!productId || !companyName || !document || !signerName) {
    return jsonResponse(
      { error: "Dados obrigatórios do contrato não informados." },
      { status: 400 },
    );
  }

  const db = await getRailwayPostgresPool();

  const clientResult = await db.query<{ id: string }>(
    `
      insert into public.clients (
        company_id,
        legal_name,
        trade_name,
        document,
        status,
        created_by,
        updated_by
      )
      values ($1, $2, $2, $3, 'active', $4, $4)
      on conflict do nothing;
    `,
    [context.companyId, companyName, document, context.domainUserId],
  );

  const client = await db.query<{ id: string }>(
    `
      select id
      from public.clients
      where company_id = $1
        and document = $2
        and deleted_at is null
      order by created_at desc
      limit 1
    `,
    [context.companyId, document],
  );

  const clientId = client.rows[0]?.id ?? clientResult.rows[0]?.id;
  if (!clientId) {
    return jsonResponse({ error: "Não foi possível cadastrar a contratante." }, { status: 500 });
  }

  const result = await db.query(
    `
      insert into public.contracts (
        company_id,
        client_id,
        product_id,
        name,
        monthly_value,
        starts_at,
        ends_at,
        status,
        signer_name,
        witness_name,
        contract_text,
        created_by,
        updated_by
      )
      select
        $1,
        $2,
        products.id,
        products.name,
        nullif(products.commercial_terms ->> 'monthlyFee', '')::numeric,
        current_date,
        current_date + interval '12 months',
        'pending',
        $4,
        nullif($5, ''),
        $6,
        $8,
        $8
      from public.products
      where products.id = $3
        and products.company_id = $1
        and products.deleted_at is null
      returning
        contracts.*,
        $7::text as client_trade_name,
        $7::text as client_legal_name,
        (select name from public.products where id = $3) as product_name
    `,
    [
      context.companyId,
      clientId,
      productId,
      signerName,
      witnessName,
      contractText,
      companyName,
      context.domainUserId,
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  return jsonResponse({ contract: result.rows[0] }, { status: 201 });
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
            count(*) filter (where status = 'Pendente')::int as pending_charges,
            count(*) filter (
              where status = 'Atrasado'
                or (status = 'Pendente' and due_date is not null and due_date < current_date)
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
                when status = 'Pendente' and due_date is not null and due_date < current_date then 'Atrasado'
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

  if (request.method === "POST" && url.pathname === "/api/contracts") {
    return handleCreateContract(request, auth.context);
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

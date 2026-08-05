import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
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
  "/api/dashboard/activity",
]);

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

async function ensureBusinessSchema() {
  if (!isRailwayPostgresConfigured()) return;

  const db = await getRailwayPostgresPool();
  await db.query(`
    create extension if not exists pgcrypto;

    create or replace function public.set_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;

    create table if not exists public.companies (
      id uuid primary key default gen_random_uuid(),
      legal_name text not null,
      trade_name text,
      document text,
      email text,
      phone text,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.roles (
      id uuid primary key default gen_random_uuid(),
      company_id uuid references public.companies(id) on delete cascade,
      name text not null,
      description text,
      is_system boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.permissions (
      id uuid primary key default gen_random_uuid(),
      key text not null unique,
      name text not null,
      description text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.role_permissions (
      id uuid primary key default gen_random_uuid(),
      role_id uuid not null references public.roles(id) on delete cascade,
      permission_id uuid not null references public.permissions(id) on delete cascade,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.users (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      auth_user_id uuid unique,
      role_id uuid references public.roles(id) on delete set null,
      name text not null,
      email text not null,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.products (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      name text not null,
      category text,
      version text,
      description text,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.clients (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      legal_name text not null,
      trade_name text,
      document text,
      city text,
      state text,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.contacts (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      client_id uuid references public.clients(id) on delete cascade,
      name text not null,
      email text,
      phone text,
      role text,
      is_primary boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.addresses (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      client_id uuid references public.clients(id) on delete cascade,
      label text,
      street text,
      number text,
      complement text,
      district text,
      city text,
      state text,
      postal_code text,
      country text not null default 'BR',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.contracts (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      client_id uuid not null references public.clients(id) on delete cascade,
      product_id uuid references public.products(id) on delete set null,
      name text,
      monthly_value numeric(14, 2),
      starts_at date,
      ends_at date,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.activity_logs (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      actor_user_id uuid references public.users(id) on delete set null,
      entity_type text not null,
      entity_id uuid,
      action text not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.user_profiles (
      id uuid primary key default gen_random_uuid(),
      auth_user_id uuid not null unique,
      first_name text,
      last_name text,
      phone text,
      job_title text,
      company_name text,
      avatar_path text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.user_preferences (
      id uuid primary key default gen_random_uuid(),
      auth_user_id uuid not null unique,
      theme text not null default 'system',
      language text not null default 'pt-BR',
      time_zone text not null default 'America/Sao_Paulo',
      date_format text not null default 'dd/MM/yyyy',
      time_format text not null default '24h',
      currency text not null default 'BRL',
      notifications jsonb not null default jsonb_build_object(
        'productUpdates', true,
        'securityAlerts', true,
        'operationalReports', false
      ),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.support_tickets (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      client_id uuid references public.clients(id) on delete set null,
      client_name text not null,
      title text not null,
      description text,
      priority text not null default 'Média',
      owner text,
      status text not null default 'Aberto',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.scheduled_calls (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references public.companies(id) on delete cascade,
      scheduled_date date not null,
      scheduled_time text not null,
      title text not null,
      client_name text not null,
      contact_name text,
      contact_email text,
      contact_phone text,
      meeting_link text,
      notes text,
      status text not null default 'Agendada',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid
    );

    create table if not exists public.app_settings (
      key text primary key,
      value jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table public.products add column if not exists commercial_terms jsonb;
    alter table public.products add column if not exists contract_template text;
    alter table public.clients add column if not exists owner_name text;
    alter table public.clients add column if not exists plan_name text;
    alter table public.contracts add column if not exists signer_name text;
    alter table public.contracts add column if not exists witness_name text;
    alter table public.contracts add column if not exists contract_text text;

    create index if not exists users_company_idx on public.users (company_id) where deleted_at is null;
    create index if not exists clients_company_idx on public.clients (company_id) where deleted_at is null;
    create index if not exists contacts_company_client_idx on public.contacts (company_id, client_id) where deleted_at is null;
    create index if not exists addresses_company_client_idx on public.addresses (company_id, client_id) where deleted_at is null;
    create index if not exists products_company_idx on public.products (company_id) where deleted_at is null;
    create index if not exists contracts_company_client_idx on public.contracts (company_id, client_id) where deleted_at is null;
    create index if not exists activity_logs_company_created_idx on public.activity_logs (company_id, created_at desc) where deleted_at is null;
    create index if not exists user_profiles_auth_user_idx on public.user_profiles (auth_user_id) where deleted_at is null;
    create index if not exists user_preferences_auth_user_idx on public.user_preferences (auth_user_id) where deleted_at is null;

    create unique index if not exists roles_company_name_unique_idx on public.roles (company_id, name) where deleted_at is null;
    create unique index if not exists role_permissions_unique_idx on public.role_permissions (role_id, permission_id) where deleted_at is null;
    create unique index if not exists users_company_email_unique_idx on public.users (company_id, email) where deleted_at is null;
    create unique index if not exists clients_company_document_unique_idx on public.clients (company_id, document) where deleted_at is null and document is not null;
    create unique index if not exists products_company_name_unique_idx on public.products (company_id, name) where deleted_at is null;

    drop trigger if exists set_companies_updated_at on public.companies;
    create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

    drop trigger if exists set_roles_updated_at on public.roles;
    create trigger set_roles_updated_at before update on public.roles for each row execute function public.set_updated_at();

    drop trigger if exists set_permissions_updated_at on public.permissions;
    create trigger set_permissions_updated_at before update on public.permissions for each row execute function public.set_updated_at();

    drop trigger if exists set_role_permissions_updated_at on public.role_permissions;
    create trigger set_role_permissions_updated_at before update on public.role_permissions for each row execute function public.set_updated_at();

    drop trigger if exists set_users_updated_at on public.users;
    create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();

    drop trigger if exists set_clients_updated_at on public.clients;
    create trigger set_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

    drop trigger if exists set_contacts_updated_at on public.contacts;
    create trigger set_contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();

    drop trigger if exists set_addresses_updated_at on public.addresses;
    create trigger set_addresses_updated_at before update on public.addresses for each row execute function public.set_updated_at();

    drop trigger if exists set_products_updated_at on public.products;
    create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();

    drop trigger if exists set_contracts_updated_at on public.contracts;
    create trigger set_contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();

    drop trigger if exists set_activity_logs_updated_at on public.activity_logs;
    create trigger set_activity_logs_updated_at before update on public.activity_logs for each row execute function public.set_updated_at();

    drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
    create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();

    drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
    create trigger set_user_preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

    drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
    create trigger set_support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();

    drop trigger if exists set_scheduled_calls_updated_at on public.scheduled_calls;
    create trigger set_scheduled_calls_updated_at before update on public.scheduled_calls for each row execute function public.set_updated_at();
  `);
}

async function getAutomyCompanyId() {
  await ensureBusinessSchema();

  const db = await getRailwayPostgresPool();
  const existing = await db.query<{ id: string }>(`
    select id
    from public.companies
    where trade_name = 'Automy'
      and deleted_at is null
    order by created_at asc
    limit 1
  `);

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await db.query<{ id: string }>(`
    insert into public.companies (legal_name, trade_name, status)
    values ('Automy Tecnologia e Automação', 'Automy', 'active')
    returning id
  `);

  const company = created.rows[0];
  if (!company) {
    throw new Error("Não foi possível criar a empresa padrão da Automy.");
  }

  return company.id;
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

async function handleClients(url: URL) {
  await ensureBusinessSchema();

  const id = url.searchParams.get("id");
  const rows = await queryRows(
    `
      select *
      from public.clients
      where deleted_at is null
        and ($1::uuid is null or id = $1::uuid)
      order by created_at desc
      limit 200
    `,
    [id],
  );

  return jsonResponse(id ? { client: rows[0] ?? null } : { clients: rows });
}

async function handleCreateClient(request: Request) {
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

  const companyId = await getAutomyCompanyId();
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
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict do nothing
      returning *
    `,
    [
      companyId,
      legalName,
      tradeName,
      document,
      typeof payload.city === "string" ? payload.city : "",
      typeof payload.state === "string" ? payload.state : "",
      typeof payload.owner === "string" ? payload.owner : "",
      typeof payload.plan === "string" ? payload.plan : "",
      mapClientStatusToDatabase(typeof payload.status === "string" ? payload.status : "pending"),
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

async function handleContracts() {
  await ensureBusinessSchema();

  const contracts = await queryRows(`
    select
      contracts.*,
      clients.trade_name as client_trade_name,
      clients.legal_name as client_legal_name,
      products.name as product_name
    from public.contracts
    left join public.clients on clients.id = contracts.client_id
    left join public.products on products.id = contracts.product_id
    where contracts.deleted_at is null
    order by contracts.created_at desc
    limit 200
  `);

  return jsonResponse({ contracts });
}

async function handleProducts() {
  await ensureBusinessSchema();

  const products = await queryRows(`
    select
      products.*,
      count(contracts.id)::int as clients
    from public.products
    left join public.contracts
      on contracts.product_id = products.id
      and contracts.deleted_at is null
    where products.deleted_at is null
    group by products.id
    order by products.created_at desc
    limit 200
  `);

  return jsonResponse({ products });
}

async function handleCreateProduct(request: Request) {
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

  const companyId = await getAutomyCompanyId();
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
        contract_template
      )
      values ($1, $2, $3, $4, $5, 'active', $6, $7)
      on conflict do nothing
      returning *, 0::int as clients
    `,
    [
      companyId,
      name,
      typeof payload.category === "string" ? payload.category : "Automação",
      typeof payload.version === "string" ? payload.version : "1.0",
      typeof payload.description === "string" ? payload.description : "",
      JSON.stringify(payload.commercialTerms ?? {}),
      typeof payload.contractTemplate === "string" ? payload.contractTemplate : "",
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto já cadastrado." }, { status: 409 });
  }

  return jsonResponse({ product: result.rows[0] }, { status: 201 });
}

async function handleUpdateProduct(request: Request) {
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
        name = coalesce(nullif($2, ''), name),
        category = coalesce(nullif($3, ''), category),
        version = coalesce(nullif($4, ''), version),
        status = coalesce(nullif($5, ''), status),
        updated_at = now()
      where id = $1
        and deleted_at is null
      returning *, 0::int as clients
    `,
    [
      id,
      typeof payload.name === "string" ? payload.name.trim() : "",
      typeof payload.category === "string" ? payload.category.trim() : "",
      typeof payload.version === "string" ? payload.version.trim() : "",
      mapProductStatusToDatabase(typeof payload.status === "string" ? payload.status : ""),
    ],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  return jsonResponse({ product: result.rows[0] });
}

async function handleDeleteProduct(request: Request) {
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
      set deleted_at = now(), updated_at = now()
      where id = $1
        and deleted_at is null
      returning id
    `,
    [id],
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

async function handleCreateContract(request: Request) {
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

  const companyId = await getAutomyCompanyId();
  const db = await getRailwayPostgresPool();

  const clientResult = await db.query<{ id: string }>(
    `
      insert into public.clients (company_id, legal_name, trade_name, document, status)
      values ($1, $2, $2, $3, 'active')
      on conflict do nothing;
    `,
    [companyId, companyName, document],
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
    [companyId, document],
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
        contract_text
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
        $6
      from public.products
      where products.id = $3
      returning
        contracts.*,
        $7::text as client_trade_name,
        $7::text as client_legal_name,
        (select name from public.products where id = $3) as product_name
    `,
    [companyId, clientId, productId, signerName, witnessName, contractText, companyName],
  );

  if (!result.rows[0]) {
    return jsonResponse({ error: "Produto não encontrado." }, { status: 404 });
  }

  return jsonResponse({ contract: result.rows[0] }, { status: 201 });
}

async function handleDashboardSummary() {
  const [clients, contracts] = await Promise.all([
    queryRows<{ status: string }>(`
      select status
      from public.clients
      where deleted_at is null
    `),
    queryRows<{ monthly_value: string | number | null; ends_at: string | null }>(`
      select monthly_value, ends_at
      from public.contracts
      where deleted_at is null
    `),
  ]);

  return jsonResponse({ clients, contracts });
}

async function handleDashboardActivity() {
  const activities = await queryRows(`
    select *
    from public.activity_logs
    where deleted_at is null
    order by created_at desc
    limit 5
  `);

  return jsonResponse({ activities });
}

async function handleTickets() {
  await ensureBusinessSchema();

  const tickets = await queryRows(`
    select *
    from public.support_tickets
    where deleted_at is null
    order by created_at desc
    limit 200
  `);

  return jsonResponse({ tickets });
}

async function handleScheduledCalls() {
  await ensureBusinessSchema();

  const calls = await queryRows(`
    select *
    from public.scheduled_calls
    where deleted_at is null
    order by scheduled_date asc, scheduled_time asc
    limit 500
  `);

  return jsonResponse({ calls });
}

async function handleCreateScheduledCall(request: Request) {
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

  const companyId = await getAutomyCompanyId();
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
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning *
    `,
    [
      companyId,
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
    ],
  );

  return jsonResponse({ call: result.rows[0] }, { status: 201 });
}

async function handleCreateTicket(request: Request) {
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

  const companyId = await getAutomyCompanyId();
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
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `,
    [
      companyId,
      clientName,
      title,
      typeof payload.description === "string" ? payload.description : "",
      typeof payload.priority === "string" ? payload.priority : "Média",
      typeof payload.owner === "string" ? payload.owner : "Automy",
      typeof payload.status === "string" ? payload.status : "Aberto",
    ],
  );

  return jsonResponse({ ticket: result.rows[0] }, { status: 201 });
}

async function handleSetting(url: URL, keyPrefix: string) {
  await ensureBusinessSchema();

  const authUserId = url.searchParams.get("authUserId");
  if (!authUserId) {
    return jsonResponse({ error: "Usuário não informado." }, { status: 400 });
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

async function handleUpdateSetting(request: Request, keyPrefix: string) {
  if (!isRailwayPostgresConfigured()) {
    return jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as { authUserId?: unknown; value?: unknown };
  const authUserId = typeof payload.authUserId === "string" ? payload.authUserId : "";
  if (!authUserId) {
    return jsonResponse({ error: "Usuário não informado." }, { status: 400 });
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

export function handleAppDataApiRequest(request: Request) {
  const url = new URL(request.url);
  if (!APP_DATA_PATHS.has(url.pathname)) return null;

  if (request.method === "POST" && url.pathname === "/api/products") {
    return handleCreateProduct(request);
  }

  if (request.method === "PATCH" && url.pathname === "/api/products") {
    return handleUpdateProduct(request);
  }

  if (request.method === "DELETE" && url.pathname === "/api/products") {
    return handleDeleteProduct(request);
  }

  if (request.method === "POST" && url.pathname === "/api/clients") {
    return handleCreateClient(request);
  }

  if (request.method === "POST" && url.pathname === "/api/contracts") {
    return handleCreateContract(request);
  }

  if (request.method === "POST" && url.pathname === "/api/support/tickets") {
    return handleCreateTicket(request);
  }

  if (request.method === "POST" && url.pathname === "/api/scheduled-calls") {
    return handleCreateScheduledCall(request);
  }

  if (request.method === "PUT" && url.pathname === "/api/settings/profile") {
    return handleUpdateSetting(request, "profile");
  }

  if (request.method === "PUT" && url.pathname === "/api/settings/preferences") {
    return handleUpdateSetting(request, "preferences");
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  if (url.pathname === "/api/clients") return handleClients(url);
  if (url.pathname === "/api/contracts") return handleContracts();
  if (url.pathname === "/api/products") return handleProducts();
  if (url.pathname === "/api/support/tickets") return handleTickets();
  if (url.pathname === "/api/scheduled-calls") return handleScheduledCalls();
  if (url.pathname === "/api/settings/profile") return handleSetting(url, "profile");
  if (url.pathname === "/api/settings/preferences") return handleSetting(url, "preferences");
  if (url.pathname === "/api/dashboard/summary") return handleDashboardSummary();
  return handleDashboardActivity();
}

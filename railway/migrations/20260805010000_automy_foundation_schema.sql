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

create table if not exists public."user" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  email_verified boolean not null default false,
  image text,
  role text not null default 'admin' check (role in ('admin', 'manager', 'operator', 'read_only')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'blocked')),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.session (
  id uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  user_id uuid not null references public."user"(id) on delete cascade,
  deleted_at timestamptz
);

create table if not exists public.account (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  provider_id text not null,
  user_id uuid not null references public."user"(id) on delete cascade,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limit (
  key text primary key,
  count integer not null default 0,
  last_request bigint not null
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  document text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  auth_user_id uuid unique references public."user"(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  name text not null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  document text,
  city text,
  state text,
  owner_user_id uuid references public.users(id) on delete set null,
  owner_name text,
  plan_name text,
  status text not null default 'pending' check (status in ('active', 'onboarding', 'pending', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
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
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
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
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text,
  version text,
  description text,
  status text not null default 'active' check (status in ('active', 'beta', 'discontinuing', 'inactive')),
  commercial_terms jsonb,
  contract_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
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
  status text not null default 'pending' check (
    status in ('active', 'onboarding', 'renewal', 'pending', 'cancelled', 'inactive')
  ),
  signer_name text,
  witness_name text,
  contract_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_auth_user_id uuid references public."user"(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references public."user"(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  job_title text,
  company_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references public."user"(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  language text not null default 'pt-BR',
  time_zone text not null default 'America/Sao_Paulo',
  date_format text not null default 'dd/MM/yyyy',
  time_format text not null default '24h' check (time_format in ('24h', '12h')),
  currency text not null default 'BRL',
  notifications jsonb not null default jsonb_build_object(
    'productUpdates', true,
    'securityAlerts', true,
    'operationalReports', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
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
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
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
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  invoice text not null,
  client_name text not null default '',
  due_date date,
  amount numeric(14, 2) not null default 0,
  method text not null default 'Mercado Pago',
  status text not null default 'Pendente' check (status in ('Pago', 'Pendente', 'Atrasado')),
  provider text not null,
  provider_topic text,
  provider_action text,
  provider_payment_id text not null,
  provider_subscription_id text,
  provider_status text,
  external_reference text,
  paid_at timestamptz,
  pending_at timestamptz,
  last_notification_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  unique (provider, provider_payment_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists better_auth_user_email_unique_idx
  on public."user" (lower(email))
  where deleted_at is null;
create index if not exists better_auth_user_role_status_idx on public."user" (role, status) where deleted_at is null;
create index if not exists better_auth_user_last_login_idx on public."user" (last_login desc);
create index if not exists session_user_id_idx on public.session (user_id) where deleted_at is null;
create index if not exists session_expires_at_idx on public.session (expires_at) where deleted_at is null;
create index if not exists account_user_id_idx on public.account (user_id);
create unique index if not exists account_provider_account_unique_idx on public.account (provider_id, account_id);
create index if not exists verification_identifier_idx on public.verification (identifier);

create unique index if not exists companies_document_unique_idx on public.companies (document) where deleted_at is null and document is not null;
create unique index if not exists companies_trade_name_unique_idx on public.companies (lower(trade_name)) where deleted_at is null and trade_name is not null;
create unique index if not exists roles_global_key_unique_idx on public.roles (key) where company_id is null and deleted_at is null;
create unique index if not exists roles_company_key_unique_idx on public.roles (company_id, key) where company_id is not null and deleted_at is null;
create unique index if not exists permissions_key_unique_idx on public.permissions (key) where deleted_at is null;
create unique index if not exists role_permissions_unique_idx on public.role_permissions (role_id, permission_id) where deleted_at is null;
create unique index if not exists users_company_email_unique_idx on public.users (company_id, lower(email)) where deleted_at is null and company_id is not null;
create unique index if not exists clients_company_document_unique_idx on public.clients (company_id, document) where deleted_at is null and document is not null;
create unique index if not exists products_company_name_unique_idx on public.products (company_id, lower(name)) where deleted_at is null;

create index if not exists users_company_idx on public.users (company_id) where deleted_at is null;
create index if not exists users_auth_user_idx on public.users (auth_user_id) where deleted_at is null;
create index if not exists clients_company_idx on public.clients (company_id) where deleted_at is null;
create index if not exists contacts_company_client_idx on public.contacts (company_id, client_id) where deleted_at is null;
create index if not exists addresses_company_client_idx on public.addresses (company_id, client_id) where deleted_at is null;
create index if not exists products_company_idx on public.products (company_id) where deleted_at is null;
create index if not exists contracts_company_client_idx on public.contracts (company_id, client_id) where deleted_at is null;
create index if not exists contracts_ends_at_idx on public.contracts (ends_at) where deleted_at is null;
create index if not exists activities_company_created_idx on public.activities (company_id, created_at desc) where deleted_at is null;
create index if not exists activity_logs_company_created_idx on public.activity_logs (company_id, created_at desc) where deleted_at is null;
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id) where deleted_at is null;
create index if not exists audit_logs_actor_created_idx on public.audit_logs (actor_auth_user_id, created_at desc) where deleted_at is null;
create index if not exists user_profiles_auth_user_idx on public.user_profiles (auth_user_id) where deleted_at is null;
create index if not exists user_preferences_auth_user_idx on public.user_preferences (auth_user_id) where deleted_at is null;
create index if not exists support_tickets_company_created_idx on public.support_tickets (company_id, created_at desc) where deleted_at is null;
create index if not exists scheduled_calls_company_date_idx on public.scheduled_calls (company_id, scheduled_date, scheduled_time) where deleted_at is null;
create index if not exists charges_due_date_idx on public.charges (due_date) where deleted_at is null;

drop trigger if exists set_better_auth_user_updated_at on public."user";
create trigger set_better_auth_user_updated_at before update on public."user" for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_session_updated_at on public.session;
create trigger set_better_auth_session_updated_at before update on public.session for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_account_updated_at on public.account;
create trigger set_better_auth_account_updated_at before update on public.account for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_verification_updated_at on public.verification;
create trigger set_better_auth_verification_updated_at before update on public.verification for each row execute function public.set_updated_at();

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

drop trigger if exists set_activities_updated_at on public.activities;
create trigger set_activities_updated_at before update on public.activities for each row execute function public.set_updated_at();

drop trigger if exists set_activity_logs_updated_at on public.activity_logs;
create trigger set_activity_logs_updated_at before update on public.activity_logs for each row execute function public.set_updated_at();

drop trigger if exists set_audit_logs_updated_at on public.audit_logs;
create trigger set_audit_logs_updated_at before update on public.audit_logs for each row execute function public.set_updated_at();

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();

drop trigger if exists set_scheduled_calls_updated_at on public.scheduled_calls;
create trigger set_scheduled_calls_updated_at before update on public.scheduled_calls for each row execute function public.set_updated_at();

drop trigger if exists set_charges_updated_at on public.charges;
create trigger set_charges_updated_at before update on public.charges for each row execute function public.set_updated_at();

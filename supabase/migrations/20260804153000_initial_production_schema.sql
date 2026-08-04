create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  document text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (company_id, name)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (role_id, permission_id)
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  name text not null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (company_id, email)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  document text,
  city text,
  state text,
  owner_user_id uuid references public.users(id) on delete set null,
  status text not null default 'pending' check (status in ('active', 'onboarding', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (company_id, document)
);

create table public.contacts (
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
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.addresses (
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
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text,
  version text,
  description text,
  status text not null default 'active' check (status in ('active', 'beta', 'discontinuing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (company_id, name)
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text,
  monthly_value numeric(14, 2),
  starts_at date,
  ends_at date,
  status text not null default 'pending' check (
    status in ('active', 'onboarding', 'renewal', 'pending', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.activity_logs (
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
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index companies_active_idx on public.companies (status) where deleted_at is null;
create index users_company_idx on public.users (company_id) where deleted_at is null;
create index users_auth_user_idx on public.users (auth_user_id) where deleted_at is null;
create index clients_company_idx on public.clients (company_id) where deleted_at is null;
create index contacts_company_client_idx on public.contacts (company_id, client_id) where deleted_at is null;
create index addresses_company_client_idx on public.addresses (company_id, client_id) where deleted_at is null;
create index products_company_idx on public.products (company_id) where deleted_at is null;
create index contracts_company_client_idx on public.contracts (company_id, client_id) where deleted_at is null;
create index contracts_ends_at_idx on public.contracts (ends_at) where deleted_at is null;
create index activity_logs_company_created_idx on public.activity_logs (company_id, created_at desc) where deleted_at is null;

create trigger set_companies_updated_at before update on public.companies
for each row execute function public.set_updated_at();
create trigger set_roles_updated_at before update on public.roles
for each row execute function public.set_updated_at();
create trigger set_permissions_updated_at before update on public.permissions
for each row execute function public.set_updated_at();
create trigger set_role_permissions_updated_at before update on public.role_permissions
for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users
for each row execute function public.set_updated_at();
create trigger set_clients_updated_at before update on public.clients
for each row execute function public.set_updated_at();
create trigger set_contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger set_addresses_updated_at before update on public.addresses
for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger set_contracts_updated_at before update on public.contracts
for each row execute function public.set_updated_at();
create trigger set_activity_logs_updated_at before update on public.activity_logs
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.contracts enable row level security;
alter table public.activity_logs enable row level security;

create or replace function app_private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.users
  where auth_user_id = (select auth.uid())
    and deleted_at is null
  limit 1
$$;

revoke all on function app_private.current_company_id() from public, anon;
grant execute on function app_private.current_company_id() to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update on tables to authenticated;

create policy companies_select_member on public.companies
for select to authenticated
using (id = app_private.current_company_id() and deleted_at is null);

create policy companies_insert_creator on public.companies
for insert to authenticated
with check (created_by = (select auth.uid()));

create policy companies_update_member on public.companies
for update to authenticated
using (id = app_private.current_company_id() and deleted_at is null)
with check (id = app_private.current_company_id());

create policy users_select_company on public.users
for select to authenticated
using (
  (company_id = app_private.current_company_id() or auth_user_id = (select auth.uid()))
  and deleted_at is null
);

create policy users_insert_self on public.users
for insert to authenticated
with check (auth_user_id = (select auth.uid()));

create policy users_update_company on public.users
for update to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy roles_select_company on public.roles
for select to authenticated
using ((company_id is null or company_id = app_private.current_company_id()) and deleted_at is null);

create policy roles_write_company on public.roles
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy permissions_select_authenticated on public.permissions
for select to authenticated
using (deleted_at is null);

create policy role_permissions_select_company on public.role_permissions
for select to authenticated
using (
  exists (
    select 1
    from public.roles
    where roles.id = role_permissions.role_id
      and roles.company_id = app_private.current_company_id()
      and roles.deleted_at is null
  )
  and deleted_at is null
);

create policy role_permissions_write_company on public.role_permissions
for all to authenticated
using (
  exists (
    select 1
    from public.roles
    where roles.id = role_permissions.role_id
      and roles.company_id = app_private.current_company_id()
      and roles.deleted_at is null
  )
  and deleted_at is null
)
with check (
  exists (
    select 1
    from public.roles
    where roles.id = role_permissions.role_id
      and roles.company_id = app_private.current_company_id()
      and roles.deleted_at is null
  )
);

create policy clients_company_access on public.clients
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy contacts_company_access on public.contacts
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy addresses_company_access on public.addresses
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy products_company_access on public.products
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy contracts_company_access on public.contracts
for all to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null)
with check (company_id = app_private.current_company_id());

create policy activity_logs_select_company on public.activity_logs
for select to authenticated
using (company_id = app_private.current_company_id() and deleted_at is null);

create policy activity_logs_insert_company on public.activity_logs
for insert to authenticated
with check (company_id = app_private.current_company_id());

-- Portal do Cliente: vínculo separado entre uma conta Better Auth e um cliente do ERP.
-- Migration aditiva: não altera nem remove dados de tabelas existentes.

-- Necessário para a FK composta abaixo e também útil para joins defensivos company+client.
create unique index if not exists clients_company_id_id_portal_unique_idx
  on public.clients (company_id, id);

create table if not exists public.client_portal_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null,
  auth_user_id uuid not null unique references public."user"(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'billing', 'technical')),
  status text not null default 'active' check (status in ('active', 'inactive', 'invited', 'suspended')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  constraint client_portal_users_company_client_fk
    foreign key (company_id, client_id)
    references public.clients(company_id, id)
    on delete cascade
);

create unique index if not exists client_portal_users_company_email_unique_idx
  on public.client_portal_users (company_id, lower(email))
  where deleted_at is null;

create index if not exists client_portal_users_company_client_idx
  on public.client_portal_users (company_id, client_id, status)
  where deleted_at is null;

create index if not exists client_portal_users_auth_user_idx
  on public.client_portal_users (auth_user_id)
  where deleted_at is null;

drop trigger if exists set_client_portal_users_updated_at on public.client_portal_users;
create trigger set_client_portal_users_updated_at
  before update on public.client_portal_users
  for each row execute function public.set_updated_at();

-- Portal do Cliente: provisionamento automatico por formalizacao de contrato.

alter table public.contracts
  add column if not exists portal_access_enabled boolean not null default true,
  add column if not exists portal_contact_name text,
  add column if not exists portal_contact_email text;

alter table public.client_portal_users
  drop constraint if exists client_portal_users_role_check;

alter table public.client_portal_users
  add constraint client_portal_users_role_check
  check (role in ('customer', 'customer_admin', 'finance', 'operations', 'read_only', 'billing', 'technical'));

alter table public.client_portal_users
  drop constraint if exists client_portal_users_status_check;

alter table public.client_portal_users
  add constraint client_portal_users_status_check
  check (status in ('invited', 'active', 'inactive', 'suspended'));

alter table public.client_portal_users
  add column if not exists invited_at timestamptz,
  add column if not exists last_access_at timestamptz,
  add column if not exists activated_at timestamptz;

alter table public."user"
  drop constraint if exists user_role_check;

alter table public."user"
  add constraint user_role_check
  check (role in ('admin', 'manager', 'operator', 'read_only', 'customer'));

alter table public."user"
  drop constraint if exists user_status_check;

alter table public."user"
  add constraint user_status_check
  check (status in ('active', 'inactive', 'pending', 'blocked', 'invited', 'suspended'));

create table if not exists public.client_portal_provisioning (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  portal_user_id uuid references public.client_portal_users(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  status text not null default 'pending'
    check (status in (
      'pending',
      'account_created',
      'delivery_pending',
      'sent',
      'activated',
      'delivery_failed',
      'conflict',
      'disabled'
    )),
  activation_token_hash text,
  invitation_expires_at timestamptz,
  requested_at timestamptz not null default now(),
  account_created_at timestamptz,
  invitation_created_at timestamptz,
  sent_at timestamptz,
  activated_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create unique index if not exists client_portal_provisioning_contract_unique
  on public.client_portal_provisioning (company_id, contract_id)
  where deleted_at is null;

create index if not exists client_portal_provisioning_client_idx
  on public.client_portal_provisioning (company_id, client_id, status)
  where deleted_at is null;

create index if not exists client_portal_provisioning_portal_user_idx
  on public.client_portal_provisioning (portal_user_id)
  where deleted_at is null;

create index if not exists client_portal_provisioning_token_hash_idx
  on public.client_portal_provisioning (activation_token_hash)
  where activation_token_hash is not null and deleted_at is null;

drop trigger if exists set_client_portal_provisioning_updated_at on public.client_portal_provisioning;
create trigger set_client_portal_provisioning_updated_at
  before update on public.client_portal_provisioning
  for each row execute function public.set_updated_at();

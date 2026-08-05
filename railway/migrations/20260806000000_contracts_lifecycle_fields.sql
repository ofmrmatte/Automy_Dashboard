alter table public.contracts
  drop constraint if exists contracts_status_check;

alter table public.contracts
  add constraint contracts_status_check
  check (status in ('active', 'onboarding', 'renewal', 'pending', 'suspended', 'cancelled', 'ended', 'inactive'));

alter table public.contracts
  add column if not exists implementation_value numeric(14, 2),
  add column if not exists renewal_at date,
  add column if not exists billing_period text,
  add column if not exists notes text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists ended_at timestamptz;

create table if not exists public.contract_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0,
  monthly_value numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create index if not exists contracts_company_status_idx
  on public.contracts (company_id, status)
  where deleted_at is null;

create index if not exists contracts_company_renewal_idx
  on public.contracts (company_id, renewal_at)
  where deleted_at is null;

create index if not exists contract_items_contract_idx
  on public.contract_items (company_id, contract_id)
  where deleted_at is null;

drop trigger if exists set_contract_items_updated_at on public.contract_items;
create trigger set_contract_items_updated_at
  before update on public.contract_items
  for each row execute function public.set_updated_at();

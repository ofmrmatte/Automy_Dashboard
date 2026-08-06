alter table public.clients
  add column if not exists state_registration text,
  add column if not exists municipal_registration text,
  add column if not exists segment text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists notes text,
  add column if not exists logo_url text;

create index if not exists clients_company_status_idx
  on public.clients (company_id, status)
  where deleted_at is null;

create index if not exists clients_company_created_at_idx
  on public.clients (company_id, created_at desc)
  where deleted_at is null;

create index if not exists clients_company_trade_name_idx
  on public.clients (company_id, lower(coalesce(trade_name, legal_name)))
  where deleted_at is null;

alter table public.clients
  add column if not exists legal_nature text,
  add column if not exists cnae text,
  add column if not exists registration_status text,
  add column if not exists opened_at date,
  add column if not exists fiscal_lookup_snapshot jsonb not null default '{}'::jsonb;

create index if not exists clients_company_cnae_idx
  on public.clients (company_id, cnae)
  where deleted_at is null;

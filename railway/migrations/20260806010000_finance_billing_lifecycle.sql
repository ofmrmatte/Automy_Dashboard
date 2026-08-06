alter table public.charges
  drop constraint if exists charges_status_check;

update public.charges
set status = case
  when status in ('Pago', 'paid') then 'paid'
  when status in ('Atrasado', 'overdue') then 'overdue'
  when status in ('Cancelado', 'canceled', 'cancelled') then 'canceled'
  when status in ('failed', 'Falhou') then 'failed'
  else 'pending'
end;

alter table public.charges
  alter column status set default 'pending',
  alter column provider set default 'manual',
  alter column provider_payment_id drop not null,
  add column if not exists reference text,
  add column if not exists description text,
  add column if not exists notes text,
  add column if not exists paid_value numeric(14, 2),
  add column if not exists canceled_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists reconciliation_status text not null default 'open';

alter table public.charges
  add constraint charges_status_check
  check (status in ('pending', 'paid', 'overdue', 'canceled', 'failed'));

alter table public.charges
  add constraint charges_reconciliation_status_check
  check (reconciliation_status in ('open', 'reconciled', 'manual_review', 'ignored'));

create unique index if not exists charges_manual_invoice_unique_idx
  on public.charges (company_id, lower(invoice))
  where deleted_at is null and provider = 'manual';

create index if not exists charges_company_status_idx
  on public.charges (company_id, status)
  where deleted_at is null;

create index if not exists charges_company_due_date_idx
  on public.charges (company_id, due_date)
  where deleted_at is null;

create index if not exists charges_company_client_idx
  on public.charges (company_id, client_id)
  where deleted_at is null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  charge_id uuid references public.charges(id) on delete set null,
  provider text not null,
  event_id text not null,
  request_id text,
  signature_timestamp timestamptz,
  topic text not null,
  data_id text not null,
  action text,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create unique index if not exists payment_webhook_events_provider_event_unique_idx
  on public.payment_webhook_events (provider, event_id)
  where deleted_at is null;

create index if not exists payment_webhook_events_company_created_idx
  on public.payment_webhook_events (company_id, created_at desc)
  where deleted_at is null;

drop trigger if exists set_payment_webhook_events_updated_at on public.payment_webhook_events;
create trigger set_payment_webhook_events_updated_at
  before update on public.payment_webhook_events
  for each row execute function public.set_updated_at();

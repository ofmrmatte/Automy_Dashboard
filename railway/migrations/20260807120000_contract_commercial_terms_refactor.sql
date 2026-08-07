alter table public.contracts
  add column if not exists description text,
  add column if not exists scope text,
  add column if not exists deliverables text,
  add column if not exists included_users integer not null default 1 check (included_users >= 0),
  add column if not exists additional_users integer not null default 0 check (additional_users >= 0),
  add column if not exists additional_user_amount numeric(14, 2) not null default 0,
  add column if not exists hosted_by_automy boolean not null default true,
  add column if not exists custom_url_enabled boolean not null default false,
  add column if not exists implementation_days integer not null default 0 check (implementation_days >= 0),
  add column if not exists database_cost numeric(14, 2) not null default 0,
  add column if not exists database_quantity integer not null default 0 check (database_quantity >= 0),
  add column if not exists operational_notes text,
  add column if not exists base_price_reference numeric(14, 2) not null default 0,
  add column if not exists discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  add column if not exists payment_method text not null default 'Boleto',
  add column if not exists installments_count integer not null default 1 check (installments_count >= 1),
  add column if not exists installment_due_days integer[] not null default '{}'::integer[],
  add column if not exists payment_terms jsonb not null default '{}'::jsonb,
  add column if not exists loyalty_months integer not null default 0 check (loyalty_months >= 0),
  add column if not exists currency text not null default 'BRL',
  add column if not exists signer_document text,
  add column if not exists signer_email text,
  add column if not exists signer_phone text,
  add column if not exists automy_representative text,
  add column if not exists witness_document text,
  add column if not exists negotiated_terms jsonb not null default '{}'::jsonb;

create index if not exists contracts_company_payment_method_idx
  on public.contracts (company_id, payment_method)
  where deleted_at is null;

create index if not exists contracts_company_currency_idx
  on public.contracts (company_id, currency)
  where deleted_at is null;

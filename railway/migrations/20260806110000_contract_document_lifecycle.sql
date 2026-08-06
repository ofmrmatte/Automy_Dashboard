alter table public.contracts
  add column if not exists contract_version integer not null default 1 check (contract_version > 0),
  add column if not exists contract_hash text,
  add column if not exists product_terms_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists negotiated_terms_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists product_contract_template_snapshot text,
  add column if not exists contract_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists last_pdf_generated_at timestamptz,
  add column if not exists signature_status text not null default 'draft'
    check (signature_status in ('draft', 'sent', 'signed', 'cancelled')),
  add column if not exists signature_provider text,
  add column if not exists signed_document_path text,
  add column if not exists signed_at timestamptz;

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version integer not null check (version > 0),
  hash text not null,
  contract_text text not null,
  contract_snapshot jsonb not null default '{}'::jsonb,
  pdf_storage_path text,
  signature_status text not null default 'draft'
    check (signature_status in ('draft', 'sent', 'signed', 'cancelled')),
  signature_provider text,
  signed_document_path text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  unique (contract_id, version)
);

create index if not exists contract_versions_contract_idx
  on public.contract_versions (company_id, contract_id, version desc)
  where deleted_at is null;

create index if not exists contracts_company_signature_status_idx
  on public.contracts (company_id, signature_status)
  where deleted_at is null;

drop trigger if exists set_contract_versions_updated_at on public.contract_versions;
create trigger set_contract_versions_updated_at
  before update on public.contract_versions
  for each row execute function public.set_updated_at();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  company_name text not null,
  email text not null,
  phone text,
  document text,
  message text,
  interest text,
  source text not null default 'landing',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'converted', 'lost', 'discarded')),
  assigned_user_id uuid references public.users(id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_path text,
  referrer text,
  consent_at timestamptz not null,
  first_contact_at timestamptz,
  converted_client_id uuid references public.clients(id) on delete set null,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create unique index if not exists leads_dedupe_active_idx
  on public.leads (lower(email), lower(company_name), source)
  where deleted_at is null and status not in ('converted', 'discarded', 'lost');

create index if not exists leads_company_status_created_idx
  on public.leads (company_id, status, created_at desc)
  where deleted_at is null;

create index if not exists leads_created_idx
  on public.leads (created_at desc)
  where deleted_at is null;

create index if not exists leads_email_idx
  on public.leads (lower(email))
  where deleted_at is null;

create table if not exists public.file_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  auth_user_id uuid references public."user"(id) on delete set null,
  provider text not null check (provider in ('railway_s3', 's3', 'cloudflare_r2')),
  bucket text not null,
  object_key text not null,
  original_file_name text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  checksum_sha256 text,
  owner_entity_type text,
  owner_entity_id uuid,
  status text not null default 'active' check (status in ('pending', 'active', 'removed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create unique index if not exists file_assets_provider_bucket_key_idx
  on public.file_assets (provider, bucket, object_key)
  where deleted_at is null;

create index if not exists file_assets_company_owner_idx
  on public.file_assets (company_id, owner_entity_type, owner_entity_id)
  where deleted_at is null;

alter table public.avatar_assets
  drop constraint if exists avatar_assets_provider_check;

alter table public.avatar_assets
  add constraint avatar_assets_provider_check
  check (provider in ('noop', 'local', 's3', 'cloudflare_r2', 'railway_volume', 'railway_s3'));

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists set_file_assets_updated_at on public.file_assets;
create trigger set_file_assets_updated_at
  before update on public.file_assets
  for each row execute function public.set_updated_at();

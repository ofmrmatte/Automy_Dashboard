create table if not exists public.company_registry_cache (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  document text not null,
  provider text not null,
  normalized_payload jsonb not null default '{}'::jsonb,
  status text not null default 'found' check (status in ('found', 'not_found', 'error')),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create unique index if not exists company_registry_cache_provider_document_idx
  on public.company_registry_cache (provider, document)
  where deleted_at is null;

create index if not exists company_registry_cache_expires_idx
  on public.company_registry_cache (provider, document, expires_at desc)
  where deleted_at is null and status = 'found';

create table if not exists public.company_registry_rate_limits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid not null references public."user"(id) on delete cascade,
  document text not null,
  provider text not null,
  window_start timestamptz not null,
  count integer not null default 1 check (count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  unique (company_id, auth_user_id, document, provider, window_start)
);

create index if not exists company_registry_rate_limits_window_idx
  on public.company_registry_rate_limits (company_id, auth_user_id, provider, window_start desc)
  where deleted_at is null;

drop trigger if exists set_company_registry_cache_updated_at on public.company_registry_cache;
create trigger set_company_registry_cache_updated_at
  before update on public.company_registry_cache
  for each row execute function public.set_updated_at();

drop trigger if exists set_company_registry_rate_limits_updated_at on public.company_registry_rate_limits;
create trigger set_company_registry_rate_limits_updated_at
  before update on public.company_registry_rate_limits
  for each row execute function public.set_updated_at();

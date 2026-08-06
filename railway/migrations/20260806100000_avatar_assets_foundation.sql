create table if not exists public.avatar_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  auth_user_id uuid not null references public."user"(id) on delete cascade,
  profile_id uuid references public.user_profiles(id) on delete set null,
  provider text not null default 'noop' check (provider in ('noop', 'local', 's3', 'cloudflare_r2', 'railway_volume')),
  storage_key text not null,
  public_url text,
  thumbnail_256_url text,
  thumbnail_512_url text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  width integer not null default 512 check (width > 0),
  height integer not null default 512 check (height > 0),
  checksum_sha256 text not null,
  original_file_name text,
  status text not null default 'active' check (status in ('active', 'removed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create index if not exists avatar_assets_auth_user_idx
  on public.avatar_assets (auth_user_id, status)
  where deleted_at is null;

create index if not exists avatar_assets_company_idx
  on public.avatar_assets (company_id, auth_user_id)
  where deleted_at is null;

drop trigger if exists set_avatar_assets_updated_at on public.avatar_assets;
create trigger set_avatar_assets_updated_at
  before update on public.avatar_assets
  for each row execute function public.set_updated_at();

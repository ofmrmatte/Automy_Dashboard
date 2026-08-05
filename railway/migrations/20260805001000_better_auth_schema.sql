create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public."user" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  email_verified boolean not null default false,
  image text,
  role text not null default 'admin' check (role in ('admin', 'manager', 'operator', 'read_only')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'blocked')),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session (
  id uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  user_id uuid not null references public."user"(id) on delete cascade
);

create table if not exists public.account (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  provider_id text not null,
  user_id uuid not null references public."user"(id) on delete cascade,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limit (
  key text primary key,
  count integer not null default 0,
  last_request bigint not null
);

create index if not exists user_role_status_idx on public."user" (role, status);
create index if not exists user_last_login_idx on public."user" (last_login desc);
create index if not exists session_user_id_idx on public.session (user_id);
create index if not exists session_expires_at_idx on public.session (expires_at);
create index if not exists account_user_id_idx on public.account (user_id);
create unique index if not exists account_provider_account_unique_idx
  on public.account (provider_id, account_id);
create index if not exists verification_identifier_idx on public.verification (identifier);

drop trigger if exists set_better_auth_user_updated_at on public."user";
create trigger set_better_auth_user_updated_at
before update on public."user"
for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_session_updated_at on public.session;
create trigger set_better_auth_session_updated_at
before update on public.session
for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_account_updated_at on public.account;
create trigger set_better_auth_account_updated_at
before update on public.account
for each row execute function public.set_updated_at();

drop trigger if exists set_better_auth_verification_updated_at on public.verification;
create trigger set_better_auth_verification_updated_at
before update on public.verification
for each row execute function public.set_updated_at();

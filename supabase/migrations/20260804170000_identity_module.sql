create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  job_title text,
  company_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  language text not null default 'pt-BR',
  time_zone text not null default 'America/Sao_Paulo',
  date_format text not null default 'dd/MM/yyyy',
  time_format text not null default '24h' check (time_format in ('24h', '12h')),
  currency text not null default 'BRL',
  notifications jsonb not null default jsonb_build_object(
    'productUpdates', true,
    'securityAlerts', true,
    'operationalReports', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index user_profiles_auth_user_idx
on public.user_profiles (auth_user_id)
where deleted_at is null;

create index user_preferences_auth_user_idx
on public.user_preferences (auth_user_id)
where deleted_at is null;

create trigger set_user_profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger set_user_preferences_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update on public.user_preferences to authenticated;

create policy user_profiles_own_select on public.user_profiles
for select to authenticated
using (auth_user_id = (select auth.uid()) and deleted_at is null);

create policy user_profiles_own_insert on public.user_profiles
for insert to authenticated
with check (auth_user_id = (select auth.uid()));

create policy user_profiles_own_update on public.user_profiles
for update to authenticated
using (auth_user_id = (select auth.uid()) and deleted_at is null)
with check (auth_user_id = (select auth.uid()));

create policy user_preferences_own_select on public.user_preferences
for select to authenticated
using (auth_user_id = (select auth.uid()) and deleted_at is null);

create policy user_preferences_own_insert on public.user_preferences
for insert to authenticated
with check (auth_user_id = (select auth.uid()));

create policy user_preferences_own_update on public.user_preferences
for update to authenticated
using (auth_user_id = (select auth.uid()) and deleted_at is null)
with check (auth_user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_own_select on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_own_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_own_update on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_own_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

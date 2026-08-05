alter table public.companies
  add column if not exists time_zone text not null default 'America/Sao_Paulo';

alter table public.user_preferences
  add column if not exists first_day_of_week integer not null default 1
  check (first_day_of_week between 0 and 6);

alter table public.user_profiles
  add column if not exists avatar_mime_type text,
  add column if not exists avatar_size integer,
  add column if not exists avatar_updated_at timestamptz;

create index if not exists companies_time_zone_idx
  on public.companies (time_zone)
  where deleted_at is null;

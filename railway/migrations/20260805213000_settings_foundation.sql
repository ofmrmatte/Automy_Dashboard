alter table public.companies
  add column if not exists state_registration text,
  add column if not exists municipal_registration text,
  add column if not exists website text,
  add column if not exists description text,
  add column if not exists segment text,
  add column if not exists postal_code text,
  add column if not exists street text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists district text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'BR',
  add column if not exists default_language text not null default 'pt-BR',
  add column if not exists default_currency text not null default 'BRL',
  add column if not exists date_format text not null default 'dd/MM/yyyy',
  add column if not exists time_format text not null default '24h',
  add column if not exists first_day_of_week integer not null default 1,
  add column if not exists business_hours jsonb not null default jsonb_build_object('start', '08:00', 'end', '18:00'),
  add column if not exists default_contract_term_days integer not null default 365,
  add column if not exists default_billing_term_days integer not null default 7,
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists display_name text,
  add column if not exists billing_legal_name text,
  add column if not exists billing_document text,
  add column if not exists billing_email text,
  add column if not exists billing_phone text,
  add column if not exists billing_address jsonb not null default '{}'::jsonb;

alter table public.companies
  drop constraint if exists companies_first_day_of_week_check,
  add constraint companies_first_day_of_week_check check (first_day_of_week between 0 and 6);

create table if not exists public.company_security_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  session_duration_days integer not null default 30 check (session_duration_days between 1 and 90),
  require_password_change_on_first_login boolean not null default false,
  min_password_length integer not null default 8 check (min_password_length between 8 and 128),
  lockout_attempts integer not null default 5 check (lockout_attempts between 3 and 20),
  lockout_duration_minutes integer not null default 15 check (lockout_duration_minutes between 1 and 1440),
  allow_multiple_sessions boolean not null default true,
  require_email_verified boolean not null default false,
  mfa_status text not null default 'not_configured' check (mfa_status in ('not_configured', 'prepared', 'enabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  auth_user_id uuid references public."user"(id) on delete set null,
  success boolean not null,
  ip_address text,
  user_agent text,
  origin text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.company_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  type text not null,
  status text not null default 'not_configured' check (status in ('connected', 'disconnected', 'not_configured', 'error', 'pending')),
  environment text not null default 'not_configured',
  public_config jsonb not null default '{}'::jsonb,
  encrypted_config_ref text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  unique (company_id, provider)
);

create table if not exists public.company_notification_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  default_sender text,
  contract_notice_days integer not null default 30 check (contract_notice_days between 0 and 365),
  billing_notice_days integer not null default 7 check (billing_notice_days between 0 and 365),
  agenda_reminder_minutes integer not null default 60 check (agenda_reminder_minutes between 0 and 10080),
  sla_warning_hours integer not null default 24 check (sla_warning_hours between 1 and 720),
  critical_alerts_enabled boolean not null default true,
  quiet_hours jsonb not null default jsonb_build_object('enabled', false, 'start', '22:00', 'end', '07:00'),
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid not null references public."user"(id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default true,
  contracts boolean not null default true,
  billing boolean not null default true,
  tickets boolean not null default true,
  agenda boolean not null default true,
  security boolean not null default true,
  admin_updates boolean not null default true,
  daily_summary boolean not null default false,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  unique (company_id, auth_user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid references public."user"(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'info',
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  related_entity_type text,
  related_entity_id uuid,
  href text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider text,
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create index if not exists company_security_company_idx on public.company_security_settings (company_id) where deleted_at is null;
create index if not exists login_history_company_created_idx on public.login_history (company_id, created_at desc) where deleted_at is null;
create index if not exists company_integrations_company_idx on public.company_integrations (company_id, provider) where deleted_at is null;
create index if not exists notification_preferences_user_idx on public.notification_preferences (auth_user_id) where deleted_at is null;
create index if not exists notifications_user_status_idx on public.notifications (auth_user_id, status, created_at desc) where deleted_at is null;
create index if not exists notifications_company_status_idx on public.notifications (company_id, status, created_at desc) where deleted_at is null;
create index if not exists notification_deliveries_notification_idx on public.notification_deliveries (notification_id) where deleted_at is null;

drop trigger if exists set_company_security_settings_updated_at on public.company_security_settings;
create trigger set_company_security_settings_updated_at before update on public.company_security_settings for each row execute function public.set_updated_at();

drop trigger if exists set_login_history_updated_at on public.login_history;
create trigger set_login_history_updated_at before update on public.login_history for each row execute function public.set_updated_at();

drop trigger if exists set_company_integrations_updated_at on public.company_integrations;
create trigger set_company_integrations_updated_at before update on public.company_integrations for each row execute function public.set_updated_at();

drop trigger if exists set_company_notification_settings_updated_at on public.company_notification_settings;
create trigger set_company_notification_settings_updated_at before update on public.company_notification_settings for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at before update on public.notification_preferences for each row execute function public.set_updated_at();

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();

drop trigger if exists set_notification_deliveries_updated_at on public.notification_deliveries;
create trigger set_notification_deliveries_updated_at before update on public.notification_deliveries for each row execute function public.set_updated_at();

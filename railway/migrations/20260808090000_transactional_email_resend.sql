create table if not exists public.transactional_emails (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  auth_user_id uuid references public."user"(id) on delete set null,
  recipient text not null,
  template text not null,
  subject text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'failed', 'bounced', 'complained', 'cancelled', 'suppressed')
  ),
  idempotency_key text not null,
  related_entity_type text,
  related_entity_id uuid,
  failure_code text,
  failure_message_safe text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  deleted_at timestamptz
);

create unique index if not exists transactional_emails_idempotency_unique_idx
  on public.transactional_emails (idempotency_key)
  where deleted_at is null;

create index if not exists transactional_emails_provider_message_idx
  on public.transactional_emails (provider_message_id)
  where deleted_at is null and provider_message_id is not null;

create index if not exists transactional_emails_company_created_idx
  on public.transactional_emails (company_id, created_at desc)
  where deleted_at is null;

create table if not exists public.transactional_email_events (
  id uuid primary key default gen_random_uuid(),
  email_id uuid references public.transactional_emails(id) on delete cascade,
  provider text not null default 'resend',
  provider_event_id text not null,
  provider_message_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists transactional_email_events_provider_event_unique_idx
  on public.transactional_email_events (provider, provider_event_id);

create index if not exists transactional_email_events_message_idx
  on public.transactional_email_events (provider_message_id, created_at desc)
  where provider_message_id is not null;

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  auth_user_id uuid references public."user"(id) on delete cascade,
  domain_user_id uuid references public.users(id) on delete cascade,
  email text not null,
  role_id uuid references public.roles(id) on delete set null,
  token_hash text not null,
  version integer not null default 1,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid references public."user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null,
  deleted_at timestamptz
);

create unique index if not exists user_invitations_token_hash_unique_idx
  on public.user_invitations (token_hash)
  where deleted_at is null;

create index if not exists user_invitations_auth_status_idx
  on public.user_invitations (auth_user_id, created_at desc)
  where deleted_at is null;

create table if not exists public.email_rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  identifier text not null,
  window_start timestamptz not null,
  attempts integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_rate_limits_scope_identifier_window_unique_idx
  on public.email_rate_limits (scope, identifier, window_start);

drop trigger if exists set_transactional_emails_updated_at on public.transactional_emails;
create trigger set_transactional_emails_updated_at
  before update on public.transactional_emails
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_invitations_updated_at on public.user_invitations;
create trigger set_user_invitations_updated_at
  before update on public.user_invitations
  for each row execute function public.set_updated_at();

drop trigger if exists set_email_rate_limits_updated_at on public.email_rate_limits;
create trigger set_email_rate_limits_updated_at
  before update on public.email_rate_limits
  for each row execute function public.set_updated_at();

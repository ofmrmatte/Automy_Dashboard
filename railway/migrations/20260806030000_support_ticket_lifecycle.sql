alter table public.support_tickets
  drop constraint if exists support_tickets_priority_check,
  drop constraint if exists support_tickets_status_check;

alter table public.support_tickets
  add column if not exists ticket_number text,
  add column if not exists category text not null default 'Operacional',
  add column if not exists owner_user_id uuid references public.users(id) on delete set null,
  add column if not exists source text not null default 'manual',
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists first_response_due_at timestamptz,
  add column if not exists resolution_due_at timestamptz,
  add column if not exists first_responded_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists reopened_at timestamptz;

update public.support_tickets
set
  priority = case
    when priority in ('Crítica', 'Critica', 'critical') then 'Crítica'
    when priority in ('Alta', 'high') then 'Alta'
    when priority in ('Baixa', 'low') then 'Baixa'
    else 'Média'
  end,
  status = case
    when status in ('Em andamento', 'in_progress') then 'Em andamento'
    when status in ('Aguardando', 'waiting') then 'Aguardando'
    when status in ('Resolvido', 'resolved') then 'Resolvido'
    when status in ('Fechado', 'closed') then 'Fechado'
    when status in ('Cancelado', 'canceled') then 'Cancelado'
    else 'Aberto'
  end,
  ticket_number = coalesce(
    ticket_number,
    concat('TCK-', to_char(created_at, 'YYYYMMDDHH24MISS'), '-', upper(substr(replace(id::text, '-', ''), 1, 6)))
  );

alter table public.support_tickets
  alter column ticket_number set not null,
  add constraint support_tickets_priority_check check (priority in ('Crítica', 'Alta', 'Média', 'Baixa')),
  add constraint support_tickets_status_check check (status in ('Aberto', 'Em andamento', 'Aguardando', 'Resolvido', 'Fechado', 'Cancelado'));

create unique index if not exists support_tickets_company_ticket_number_idx
  on public.support_tickets (company_id, ticket_number)
  where deleted_at is null;

create index if not exists support_tickets_company_status_idx
  on public.support_tickets (company_id, status, updated_at desc)
  where deleted_at is null;

create index if not exists support_tickets_company_priority_idx
  on public.support_tickets (company_id, priority, updated_at desc)
  where deleted_at is null;

create index if not exists support_tickets_company_client_idx
  on public.support_tickets (company_id, client_id)
  where deleted_at is null;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  author_name text not null,
  body text not null,
  visibility text not null default 'internal' check (visibility in ('internal', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create table if not exists public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references public."user"(id) on delete set null,
  updated_by uuid references public."user"(id) on delete set null
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (company_id, ticket_id, created_at asc)
  where deleted_at is null;

create index if not exists support_ticket_events_ticket_idx
  on public.support_ticket_events (company_id, ticket_id, created_at desc)
  where deleted_at is null;

create index if not exists support_ticket_attachments_ticket_idx
  on public.support_ticket_attachments (company_id, ticket_id, created_at desc)
  where deleted_at is null;

drop trigger if exists set_support_ticket_messages_updated_at on public.support_ticket_messages;
create trigger set_support_ticket_messages_updated_at before update on public.support_ticket_messages for each row execute function public.set_updated_at();

drop trigger if exists set_support_ticket_events_updated_at on public.support_ticket_events;
create trigger set_support_ticket_events_updated_at before update on public.support_ticket_events for each row execute function public.set_updated_at();

drop trigger if exists set_support_ticket_attachments_updated_at on public.support_ticket_attachments;
create trigger set_support_ticket_attachments_updated_at before update on public.support_ticket_attachments for each row execute function public.set_updated_at();

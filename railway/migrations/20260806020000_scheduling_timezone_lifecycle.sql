alter table public.scheduled_calls
  drop constraint if exists scheduled_calls_status_check;

alter table public.scheduled_calls
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists owner_user_id uuid references public.users(id) on delete set null,
  add column if not exists description text,
  add column if not exists participants jsonb not null default '[]'::jsonb,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists timezone text not null default 'America/Sao_Paulo',
  add column if not exists reminder_minutes integer not null default 30,
  add column if not exists completed_at timestamptz,
  add column if not exists canceled_at timestamptz;

update public.scheduled_calls
set
  status = case
    when status in ('Agendada', 'scheduled') then 'scheduled'
    when status in ('Reagendada', 'rescheduled') then 'rescheduled'
    when status in ('Concluída', 'Concluida', 'completed') then 'completed'
    when status in ('Cancelada', 'canceled', 'cancelled') then 'canceled'
    else 'scheduled'
  end,
  start_at = coalesce(
    start_at,
    (
      (scheduled_date::text || ' ' || scheduled_time)::timestamp
      at time zone coalesce(nullif(timezone, ''), 'America/Sao_Paulo')
    )
  ),
  end_at = coalesce(
    end_at,
    (
      (scheduled_date::text || ' ' || scheduled_time)::timestamp
      at time zone coalesce(nullif(timezone, ''), 'America/Sao_Paulo')
    ) + interval '30 minutes'
  );

alter table public.scheduled_calls
  alter column status set default 'scheduled',
  alter column start_at set not null,
  alter column end_at set not null;

alter table public.scheduled_calls
  add constraint scheduled_calls_status_check
  check (status in ('scheduled', 'rescheduled', 'completed', 'canceled'));

alter table public.scheduled_calls
  add constraint scheduled_calls_interval_check
  check (end_at > start_at);

alter table public.scheduled_calls
  add constraint scheduled_calls_reminder_minutes_check
  check (reminder_minutes >= 0 and reminder_minutes <= 10080);

create index if not exists scheduled_calls_company_start_idx
  on public.scheduled_calls (company_id, start_at)
  where deleted_at is null;

create index if not exists scheduled_calls_company_status_idx
  on public.scheduled_calls (company_id, status)
  where deleted_at is null;

create index if not exists scheduled_calls_company_client_idx
  on public.scheduled_calls (company_id, client_id)
  where deleted_at is null;

alter table public.rate_limit
  add column if not exists id uuid default gen_random_uuid();

update public.rate_limit
set id = gen_random_uuid()
where id is null;

alter table public.rate_limit
  alter column id set not null;

create unique index if not exists rate_limit_id_unique_idx on public.rate_limit (id);
create unique index if not exists rate_limit_key_unique_idx on public.rate_limit (key);

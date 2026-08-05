do $$
declare
  constraint_name text;
begin
  update public."user"
  set status = case status
    when 'pending' then 'invited'
    when 'blocked' then 'suspended'
    else status
  end
  where status in ('pending', 'blocked');

  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public."user"'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public."user" drop constraint %I', constraint_name);
  end loop;

  alter table public."user"
    add constraint user_status_check
    check (status in ('active', 'inactive', 'invited', 'suspended'));
end $$;

do $$
declare
  constraint_name text;
begin
  update public.users
  set status = case status
    when 'pending' then 'invited'
    when 'blocked' then 'suspended'
    else status
  end
  where status in ('pending', 'blocked');

  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.users drop constraint %I', constraint_name);
  end loop;

  alter table public.users
    add constraint users_status_check
    check (status in ('active', 'inactive', 'invited', 'suspended'));
end $$;

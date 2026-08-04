insert into public.user_profiles (
  auth_user_id,
  first_name,
  last_name,
  created_by,
  updated_by
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'first_name', ''),
  coalesce(users.raw_user_meta_data ->> 'last_name', ''),
  users.id,
  users.id
from auth.users
where not exists (
  select 1
  from public.user_profiles
  where user_profiles.auth_user_id = users.id
);

insert into public.user_preferences (
  auth_user_id,
  created_by,
  updated_by
)
select
  users.id,
  users.id,
  users.id
from auth.users
where not exists (
  select 1
  from public.user_preferences
  where user_preferences.auth_user_id = users.id
);

notify pgrst, 'reload schema';

revoke all on table public.user_profiles from anon, public;
revoke all on table public.user_preferences from anon, public;

grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

notify pgrst, 'reload schema';

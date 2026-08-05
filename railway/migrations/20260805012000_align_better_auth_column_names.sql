create or replace function public.set_better_auth_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'email_verified'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'emailVerified'
  ) then
    alter table public."user" rename column email_verified to "emailVerified";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'createdAt'
  ) then
    alter table public."user" rename column created_at to "createdAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'updated_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'updatedAt'
  ) then
    alter table public."user" rename column updated_at to "updatedAt";
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'expires_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'expiresAt'
  ) then
    alter table public.session rename column expires_at to "expiresAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'createdAt'
  ) then
    alter table public.session rename column created_at to "createdAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'updated_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'updatedAt'
  ) then
    alter table public.session rename column updated_at to "updatedAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'ip_address'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'ipAddress'
  ) then
    alter table public.session rename column ip_address to "ipAddress";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'user_agent'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'userAgent'
  ) then
    alter table public.session rename column user_agent to "userAgent";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'session' and column_name = 'userId'
  ) then
    alter table public.session rename column user_id to "userId";
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'account_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'accountId'
  ) then
    alter table public.account rename column account_id to "accountId";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'provider_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'providerId'
  ) then
    alter table public.account rename column provider_id to "providerId";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'userId'
  ) then
    alter table public.account rename column user_id to "userId";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'access_token'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'accessToken'
  ) then
    alter table public.account rename column access_token to "accessToken";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'refresh_token'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'refreshToken'
  ) then
    alter table public.account rename column refresh_token to "refreshToken";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'id_token'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'idToken'
  ) then
    alter table public.account rename column id_token to "idToken";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'access_token_expires_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'accessTokenExpiresAt'
  ) then
    alter table public.account rename column access_token_expires_at to "accessTokenExpiresAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'refresh_token_expires_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'refreshTokenExpiresAt'
  ) then
    alter table public.account rename column refresh_token_expires_at to "refreshTokenExpiresAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'createdAt'
  ) then
    alter table public.account rename column created_at to "createdAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'updated_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'updatedAt'
  ) then
    alter table public.account rename column updated_at to "updatedAt";
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'expires_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'expiresAt'
  ) then
    alter table public.verification rename column expires_at to "expiresAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'createdAt'
  ) then
    alter table public.verification rename column created_at to "createdAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'updated_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'verification' and column_name = 'updatedAt'
  ) then
    alter table public.verification rename column updated_at to "updatedAt";
  end if;
end $$;

drop trigger if exists set_better_auth_user_updated_at on public."user";
create trigger set_better_auth_user_updated_at before update on public."user" for each row execute function public.set_better_auth_updated_at();

drop trigger if exists set_better_auth_session_updated_at on public.session;
create trigger set_better_auth_session_updated_at before update on public.session for each row execute function public.set_better_auth_updated_at();

drop trigger if exists set_better_auth_account_updated_at on public.account;
create trigger set_better_auth_account_updated_at before update on public.account for each row execute function public.set_better_auth_updated_at();

drop trigger if exists set_better_auth_verification_updated_at on public.verification;
create trigger set_better_auth_verification_updated_at before update on public.verification for each row execute function public.set_better_auth_updated_at();

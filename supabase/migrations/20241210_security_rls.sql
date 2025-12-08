-- Hardening RLS and policies for conference data + spam flags
set check_function_bodies = off;

-- Admin helper to centralize authorization
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_email text;
  jwt_role text;
begin
  jwt_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  jwt_role := coalesce(auth.jwt() ->> 'role', '');

  if jwt_role = 'service_role' then
    return true;
  end if;

  return exists (
    select 1
    from admin_users au
    where lower(au.email) = jwt_email
  );
end;
$$;

comment on function public.is_admin is 'Returns true for service_role or when the JWT email is present in admin_users.';

-- Core tables
alter table if exists conferences enable row level security;
alter table if exists registrations enable row level security;
alter table if exists email_outbox enable row level security;
alter table if exists admin_users enable row level security;

-- Optional tables (guarded so migration does not fail if they are absent)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'site_settings') then
    execute 'alter table site_settings enable row level security';
  end if;
end$$;

-- Constraints & flags to help spam handling
alter table if exists registrations
  add column if not exists is_spam boolean not null default false,
  add column if not exists archived boolean not null default false,
  add column if not exists spam_reason text,
  add constraint registrations_full_name_length check (char_length(full_name) between 2 and 80),
  add constraint registrations_email_length check (char_length(email) between 3 and 320);

create index if not exists registrations_is_spam_idx on registrations(is_spam);
create index if not exists registrations_archived_idx on registrations(archived);

-- Drop permissive/default policies where present
drop policy if exists "Allow read access for authenticated users" on admin_users;
drop policy if exists "Allow read access for all users" on admin_users;

-- Conferences: public can read published rows, admin can manage
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'conferences_select_published') then
    create policy conferences_select_published
      on conferences
      for select
      to anon, authenticated
      using (is_published = true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'conferences_admin_manage') then
    create policy conferences_admin_manage
      on conferences
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Registrations: default deny; allow insert to anon/auth; reads & writes only for admin
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'registrations_insert_public') then
    create policy registrations_insert_public
      on registrations
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'registrations_admin_select') then
    create policy registrations_admin_select
      on registrations
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'registrations_admin_write') then
    create policy registrations_admin_write
      on registrations
      for update, delete
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Email outbox: only admin/service
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'email_outbox_admin_all') then
    create policy email_outbox_admin_all
      on email_outbox
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Admin users: only admin/service can read/write
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'admin_users_admin_all') then
    create policy admin_users_admin_all
      on admin_users
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Site settings (if present): readable publicly, only admin can write
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'site_settings') then
    if not exists (select 1 from pg_policies where policyname = 'site_settings_select_public') then
      create policy site_settings_select_public
        on site_settings
        for select
        to anon, authenticated
        using (true);
    end if;

    if not exists (select 1 from pg_policies where policyname = 'site_settings_admin_write') then
      create policy site_settings_admin_write
        on site_settings
        for update
        to authenticated
        using (public.is_admin())
        with check (public.is_admin());
    end if;
  end if;
end$$;


-- Enforce two categories and participation defaults
do $$
begin
  -- Ensure category column is text (if previously enum)
  perform 1 from information_schema.columns
   where table_name = 'registrations' and column_name = 'category' and data_type = 'USER-DEFINED';
  if found then
    alter table registrations alter column category drop default;
    alter table registrations alter column category type text using category::text;
  end if;
end$$;

alter table registrations
  add column if not exists participation_type text not null default 'pasiv',
  add column if not exists points int not null default 12;

-- Backfill category mapping
update registrations set category = 'farmacist' where category = 'member';
update registrations set category = 'teknik' where category in ('non_member', 'student');

-- Backfill defaults
update registrations set participation_type = coalesce(participation_type, 'pasiv');
update registrations set points = coalesce(points, 12);

-- Constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'registrations_category_check') then
    alter table registrations add constraint registrations_category_check check (category in ('farmacist', 'teknik'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'registrations_participation_check') then
    alter table registrations add constraint registrations_participation_check check (participation_type in ('pasiv', 'aktiv'));
  end if;
end$$;

-- Email delivery observability and outbox

-- Add tracking columns to registrations
alter table registrations
  add column if not exists email_status text not null default 'pending',
  add column if not exists email_attempts int not null default 0,
  add column if not exists email_last_error text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists resend_last_at timestamptz,
  add column if not exists resend_count int not null default 0;

-- Ensure uniqueness guard is present (add only if missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'registrations_conference_email_unique'
  ) then
    alter table registrations
      add constraint registrations_conference_email_unique unique (conference_id, email);
  end if;
end$$;

-- Helpful indexes
create index if not exists registrations_email_status_idx on registrations(email_status);
create index if not exists registrations_conference_email_idx on registrations(conference_id, email);

-- Outbox for email attempts
create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_outbox_registration_idx on email_outbox(registration_id);
create index if not exists email_outbox_status_idx on email_outbox(status);
create index if not exists email_outbox_provider_idx on email_outbox(provider_id);

-- Maintain updated_at
create or replace function email_outbox_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_email_outbox_set_timestamp on email_outbox;
create trigger trg_email_outbox_set_timestamp
before update on email_outbox
for each row
execute procedure email_outbox_set_timestamp();

-- Supabase schema for SHFMK conference registration
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists conferences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  start_date date,
  end_date date,
  location text,
  registration_open timestamptz,
  registration_close timestamptz,
  max_participants integer,
  currency text not null default 'EUR',
  member_fee numeric(10,2) not null default 0,
  non_member_fee numeric(10,2) not null default 0,
  student_fee numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references conferences(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  institution text,
  category text not null,
  fee_amount numeric(10,2) not null,
  currency text not null default 'EUR',
  payment_status text not null default 'pending',
  checked_in_at timestamptz,
  qr_token text,
  created_at timestamptz not null default now()
);

create index if not exists registrations_conference_idx on registrations(conference_id);
create index if not exists registrations_email_idx on registrations(email);
create index if not exists registrations_created_idx on registrations(created_at desc);

-- Seed conference
insert into conferences (name, slug, start_date, end_date, location, registration_open, registration_close, max_participants, currency, member_fee, non_member_fee, student_fee)
values (
  'Shoqata Farmaceutike e Kosovës - Annual Conference',
  'annual-conference',
  '2024-10-15',
  '2024-10-17',
  'Prishtina, Kosovo',
  now() - interval '1 day',
  now() + interval '30 days',
  800,
  'EUR',
  50.00,
  80.00,
  30.00
)
on conflict (slug) do nothing;

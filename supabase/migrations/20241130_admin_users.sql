-- Create admin_users table
create table if not exists admin_users (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table admin_users enable row level security;

-- Create policy to allow read access for authenticated users
-- This allows the application (authenticated as a user) to check if their email is in the list
create policy "Allow read access for authenticated users"
  on admin_users
  for select
  to authenticated
  using (true);

-- Seed initial admin user (replace with your email)
insert into admin_users (email)
values ('arben.lila@gmail.com')
on conflict (email) do nothing;

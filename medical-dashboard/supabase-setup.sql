-- Table for all user data (mirrors localStorage structure)
create table if not exists user_data (
  user_id text not null,
  key text not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- Table for user profiles
create table if not exists profiles (
  id text primary key,
  name text unique not null,
  pin text not null default ''
);

-- Disable RLS for simplicity (family app, no sensitive auth needed)
alter table user_data disable row level security;
alter table profiles disable row level security;

-- Insert the 4 family users
insert into profiles (id, name, pin) values
  ('anna', 'Anna', ''),
  ('nando', 'Nando', ''),
  ('francesco', 'Francesco', ''),
  ('federica', 'Federica', '')
on conflict (id) do nothing;

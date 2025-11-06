-- Madstudio Booking schema
-- Run with: supabase db push --file supabase/schema.sql

create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'viewer');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_rule_type') THEN
    CREATE TYPE availability_rule_type AS ENUM ('weekly', 'exception');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
    CREATE TYPE slot_status AS ENUM ('available', 'requested', 'approved', 'blocked');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'declined', 'canceled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_created_via') THEN
    CREATE TYPE slot_created_via AS ENUM ('rule', 'manual');
  END IF;
END
$$;

create table if not exists studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

insert into studios (name, slug)
values ('Main Studio', 'main-studio')
on conflict (slug) do nothing;

alter table studios
  add column if not exists description text;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'admin',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type availability_rule_type not null,
  weekday int,
  start_time time not null,
  end_time time not null,
  date date,
  is_open boolean not null default true,
  studio_id uuid not null references studios(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (rule_type = 'weekly' and weekday between 0 and 6 and date is null)
    or
    (rule_type = 'exception' and date is not null)
  ),
  check (start_time < end_time)
);

alter table availability_rules
  add column if not exists studio_id uuid references studios(id);

with main as (
  select id from studios where slug = 'main-studio' limit 1
)
update availability_rules
set studio_id = (select id from main)
where studio_id is null;

alter table availability_rules
  alter column studio_id set not null;

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status slot_status not null default 'available',
  hold_expires_at timestamptz,
  created_via slot_created_via not null default 'rule',
  studio_id uuid not null references studios(id) on delete cascade,
  constraint slots_overlap_unique unique (start_at, end_at)
);

alter table slots
  add column if not exists studio_id uuid references studios(id);

with main as (
  select id from studios where slug = 'main-studio' limit 1
)
update slots
set studio_id = (select id from main)
where studio_id is null;

alter table slots
  alter column studio_id set not null;

alter table slots
  drop constraint if exists slots_overlap_unique;

alter table slots
  add constraint slots_overlap_unique unique (studio_id, start_at, end_at);

create index if not exists slots_start_idx on slots (start_at);
create index if not exists slots_status_idx on slots (status);
create index if not exists slots_studio_idx on slots (studio_id);
create index if not exists availability_rules_studio_idx on availability_rules (studio_id);

create table if not exists studio_images (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_images_studio_idx on studio_images (studio_id, sort_order);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references slots(id) on delete cascade,
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text not null,
  notes text,
  status booking_status not null default 'pending',
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_slot_idx on bookings (slot_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function count_bookings_today(studio uuid default null)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from bookings b
  join slots s on s.id = b.slot_id
  where b.status = 'approved'
    and date_trunc('day', s.start_at at time zone 'Asia/Muscat') =
        date_trunc('day', now() at time zone 'Asia/Muscat')
    and (studio is null or s.studio_id = studio);
$$;

create or replace function count_bookings_this_week(studio uuid default null)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from bookings b
  join slots s on s.id = b.slot_id
  where b.status = 'approved'
    and date_trunc('week', s.start_at at time zone 'Asia/Muscat') =
        date_trunc('week', now() at time zone 'Asia/Muscat')
    and (studio is null or s.studio_id = studio);
$$;

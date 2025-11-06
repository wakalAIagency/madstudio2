-- Madstudio Booking schema
-- Run with: supabase db push --file supabase/schema.sql

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'viewer');
create type availability_rule_type as enum ('weekly', 'exception');
create type slot_status as enum ('available', 'requested', 'approved', 'blocked');
create type booking_status as enum ('pending', 'approved', 'declined', 'canceled');
create type slot_created_via as enum ('rule', 'manual');

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
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (rule_type = 'weekly' and weekday between 0 and 6 and date is null)
    or
    (rule_type = 'exception' and date is not null)
  ),
  check (start_time < end_time)
);

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status slot_status not null default 'available',
  hold_expires_at timestamptz,
  created_via slot_created_via not null default 'rule',
  constraint slots_overlap_unique unique (start_at, end_at)
);

create index if not exists slots_start_idx on slots (start_at);
create index if not exists slots_status_idx on slots (status);

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

alter table bookings
  add constraint bookings_status_slot_consistency
  check (
    (status = 'pending' and exists (select 1 from slots where id = slot_id and status in ('requested', 'available')))
    or
    (status = 'approved' and exists (select 1 from slots where id = slot_id and status = 'approved'))
    or
    (status in ('declined', 'canceled'))
  );

create or replace function count_bookings_today()
returns integer
language sql
stable
as $$
  select count(*)::integer
  from bookings b
  join slots s on s.id = b.slot_id
  where b.status = 'approved'
    and date_trunc('day', s.start_at at time zone 'Asia/Muscat') =
        date_trunc('day', now() at time zone 'Asia/Muscat');
$$;

create or replace function count_bookings_this_week()
returns integer
language sql
stable
as $$
  select count(*)::integer
  from bookings b
  join slots s on s.id = b.slot_id
  where b.status = 'approved'
    and date_trunc('week', s.start_at at time zone 'Asia/Muscat') =
        date_trunc('week', now() at time zone 'Asia/Muscat');
$$;

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text unique not null,
  room_type text not null default 'Deluxe',
  floor integer,
  capacity integer not null default 2,
  base_price numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  email text not null,
  phone text not null,
  check_in date not null,
  check_out date not null,
  rooms_requested integer not null check (rooms_requested between 1 and 28),
  adults integer not null default 1,
  children integer not null default 0,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_booking_dates check (check_out > check_in)
);

create table if not exists public.banquet_bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  email text not null,
  phone text not null,
  event_date date not null,
  event_type text not null,
  guest_count integer not null check (guest_count > 0),
  spaces text[] not null default '{}',
  catering_required boolean not null default true,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null,
  enquiry_type text not null default 'general',
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_room_bookings_dates on public.room_bookings (check_in, check_out, status);
create index if not exists idx_banquet_bookings_date on public.banquet_bookings (event_date, status);
create index if not exists idx_enquiries_status on public.enquiries (status, created_at);

insert into public.rooms (room_number, room_type, floor, capacity, base_price)
select
  lpad(series::text, 3, '0'),
  case when series <= 20 then 'Deluxe Room' else 'Family Suite' end,
  case when series <= 10 then 1 when series <= 20 then 2 else 3 end,
  case when series <= 20 then 2 else 4 end,
  case when series <= 20 then 3200 else 5200 end
from generate_series(1, 28) as series
on conflict (room_number) do nothing;

alter table public.rooms enable row level security;
alter table public.room_bookings enable row level security;
alter table public.banquet_bookings enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "Service role can manage rooms" on public.rooms;
drop policy if exists "Service role can manage room bookings" on public.room_bookings;
drop policy if exists "Service role can manage banquet bookings" on public.banquet_bookings;
drop policy if exists "Service role can manage enquiries" on public.enquiries;

create policy "Service role can manage rooms"
on public.rooms for all
to service_role
using (true)
with check (true);

create policy "Service role can manage room bookings"
on public.room_bookings for all
to service_role
using (true)
with check (true);

create policy "Service role can manage banquet bookings"
on public.banquet_bookings for all
to service_role
using (true)
with check (true);

create policy "Service role can manage enquiries"
on public.enquiries for all
to service_role
using (true)
with check (true);

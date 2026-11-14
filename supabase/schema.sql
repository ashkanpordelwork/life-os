-- Life OS database. Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Every table has row-level security: each user can only read and change their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  symptoms text[] not null default '{}',
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Added for the "brain" update: sleep times and the starting answers (for "Up X since you started").
alter table public.profiles add column if not exists start_answers jsonb;
alter table public.profiles add column if not exists wake_time text;
alter table public.profiles add column if not exists bed_time text;
alter table public.profiles add column if not exists health jsonb;

create table if not exists public.sprints (
  user_id uuid not null references auth.users (id) on delete cascade,
  number int not null,
  theme text,
  length_days int not null default 14,
  patch_ids text[] not null,
  started_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, number)
);

create table if not exists public.checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  item_id text not null,
  version text not null default 'standard',
  created_at timestamptz not null default now(),
  primary key (user_id, day, item_id)
);

alter table public.profiles enable row level security;
alter table public.sprints enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own sprints" on public.sprints;
create policy "own sprints" on public.sprints
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own checkins" on public.checkins;
create policy "own checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Reminders (push + in-app) ----------
create table if not exists public.reminders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  push_enabled boolean not null default false,
  inapp_enabled boolean not null default true,
  remind_at text not null default '09:00',
  tz text not null default 'UTC',
  last_sent_on date
);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "own reminders" on public.reminders;
create policy "own reminders" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Plans (see supabase/migrations-plans.sql for the trigger and the founding-member update).
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists founder boolean not null default false;
alter table public.profiles add column if not exists pro_since timestamptz;

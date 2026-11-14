-- Personal experiments: a daily check-in (energy, mood, sleep, focus) and self-experiments.
-- Run once in Supabase → SQL Editor. Safe to run again.

create table if not exists public.daily_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  sleep smallint check (sleep between 1 and 5),
  focus smallint check (focus between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  metric text not null check (metric in ('energy', 'mood', 'sleep', 'focus')),
  start_day date not null,
  days int not null check (days between 3 and 28),
  created_at timestamptz not null default now()
);

alter table public.daily_logs enable row level security;
alter table public.experiments enable row level security;

drop policy if exists "own daily logs" on public.daily_logs;
create policy "own daily logs" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own experiments" on public.experiments;
create policy "own experiments" on public.experiments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Life modes: travel, sick, deadline week, vacation.
-- Run once in Supabase → SQL Editor. Safe to run again.
create table if not exists public.life_modes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('travel', 'sick', 'deadline', 'vacation')),
  start_day date not null,
  end_day date not null,
  created_at timestamptz not null default now()
);
alter table public.life_modes enable row level security;
drop policy if exists "own modes" on public.life_modes;
create policy "own modes" on public.life_modes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

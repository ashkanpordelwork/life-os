-- Personal goals and real amounts (user feedback: "let me pick 5,000 steps", "log how much water").
-- Run once in Supabase → SQL Editor. Safe to run again.

-- How much was done on a day (steps, ml, g, reps). Empty = a plain tick.
alter table public.checkins add column if not exists amount numeric check (amount is null or amount >= 0);

-- The user's own goal per habit, e.g. EX01a = 5000 steps.
create table if not exists public.habit_goals (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  goal numeric not null check (goal > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.habit_goals enable row level security;
drop policy if exists "own goals" on public.habit_goals;
create policy "own goals" on public.habit_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

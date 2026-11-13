-- Run once in Supabase → SQL Editor. Safe to run again.
alter table public.profiles add column if not exists start_answers jsonb;
alter table public.profiles add column if not exists wake_time text;
alter table public.profiles add column if not exists bed_time text;
alter table public.profiles add column if not exists health jsonb;

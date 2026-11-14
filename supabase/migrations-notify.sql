-- Smart notifications: a push at each patch's own time, and a push when someone sends a high five.
-- Run once in Supabase → SQL Editor (after migrations-tribes.sql). Safe to run again.

alter table public.reminders add column if not exists patch_push boolean not null default true;
alter table public.reminders add column if not exists tribe_push boolean not null default true;
-- Today's patch times, worked out by the app from the user's wake and bed time: [{id, title, at, cutoff}]
alter table public.reminders add column if not exists patch_times jsonb not null default '[]';

-- What was already sent today, so nothing is sent twice. Only the server reads and writes it.
create table if not exists public.push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  day date not null,
  primary key (user_id, key, day)
);
alter table public.push_log enable row level security;

alter table public.high_fives add column if not exists notified boolean not null default false;

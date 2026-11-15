-- Tribe feed: one post per habit done (owner decision). Posts are tribe_events with kind 'habit'.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1. Allow the new kind.
alter table public.tribe_events drop constraint if exists tribe_events_kind_check;
alter table public.tribe_events add constraint tribe_events_kind_check
  check (kind in ('active', 'all_done', 'release', 'joined', 'habit'));

-- 2. The old rule "one of each kind per person per day" stays for the old kinds.
--    Habit posts are one per habit per day instead (payload.key = the habit, or a private key).
alter table public.tribe_events drop constraint if exists tribe_events_user_id_kind_day_key;
create unique index if not exists tribe_events_once_per_day
  on public.tribe_events (user_id, kind, day) where kind <> 'habit';
create unique index if not exists tribe_events_habit_once
  on public.tribe_events (user_id, day, (payload->>'key')) where kind = 'habit';
create index if not exists tribe_events_habit_recent
  on public.tribe_events (created_at desc) where kind = 'habit';

-- 3. Unticking a habit removes its post (and its high fives, which cascade).
drop policy if exists "delete own events" on public.tribe_events;
create policy "delete own events" on public.tribe_events for delete using (user_id = auth.uid());

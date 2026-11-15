-- Tribe play: reactions on anything, friendly nudges, and the weekly board.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1. Reactions. A reaction goes to a member's feed post (event_id) or to their day (event_id empty).
create table if not exists public.tribe_reactions (
  id bigint generated always as identity primary key,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  event_id bigint references public.tribe_events (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('five', 'fire', 'power')),
  created_at timestamptz not null default now(),
  notified boolean not null default false
);
create unique index if not exists tribe_reactions_once
  on public.tribe_reactions (from_user, to_user, day, kind, coalesce(event_id, 0));
create index if not exists tribe_reactions_to on public.tribe_reactions (to_user, day desc);

alter table public.tribe_reactions enable row level security;
drop policy if exists "read shared reactions" on public.tribe_reactions;
create policy "read shared reactions" on public.tribe_reactions for select
  using (from_user = auth.uid() or public.shares_tribe(to_user));
drop policy if exists "give reaction" on public.tribe_reactions;
create policy "give reaction" on public.tribe_reactions for insert with check (
  from_user = auth.uid() and to_user <> auth.uid() and public.shares_tribe(to_user)
);
drop policy if exists "take back reaction" on public.tribe_reactions;
create policy "take back reaction" on public.tribe_reactions for delete using (from_user = auth.uid());

-- Old high fives become 'five' reactions (already announced, so no push for them).
insert into public.tribe_reactions (from_user, to_user, event_id, day, kind, created_at, notified)
select h.from_user, e.user_id, h.event_id, e.day, 'five', h.created_at, true
from public.high_fives h join public.tribe_events e on e.id = h.event_id
on conflict do nothing;

-- 2. Nudges: a friendly poke for someone who hasn't started today. One per person per day.
-- allow_nudges = the choice AND not sick or on vacation (what send_nudge checks); share_nudges = just the user's choice.
alter table public.tribe_status add column if not exists allow_nudges boolean not null default true;
alter table public.tribe_status add column if not exists share_nudges boolean not null default true;

create table if not exists public.tribe_nudges (
  id bigint generated always as identity primary key,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  day date not null,
  msg smallint not null default 0 check (msg between 0 and 31),
  created_at timestamptz not null default now(),
  notified boolean not null default false,
  unique (from_user, to_user, day)
);
alter table public.tribe_nudges enable row level security;
drop policy if exists "read my nudges" on public.tribe_nudges;
create policy "read my nudges" on public.tribe_nudges for select using (from_user = auth.uid() or to_user = auth.uid());
-- No direct writes: nudges only go through send_nudge() below, which enforces the rules.

create or replace function public.send_nudge(p_to uuid, p_day date, p_msg int) returns text
language plpgsql security definer set search_path = public as $$
declare st tribe_status;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_to = auth.uid() or not public.shares_tribe(p_to) then return 'not_allowed'; end if;
  select * into st from tribe_status where user_id = p_to;
  if st.user_id is null or st.allow_nudges is false then return 'off'; end if;
  if st.day = p_day and st.done > 0 then return 'started'; end if;
  if (select count(*) from tribe_nudges where from_user = auth.uid() and day = p_day) >= 5 then return 'limit'; end if;
  insert into tribe_nudges (from_user, to_user, day, msg) values (auth.uid(), p_to, p_day, greatest(0, least(31, p_msg)))
    on conflict do nothing;
  if not found then return 'already'; end if;
  return 'ok';
end $$;
grant execute on function public.send_nudge(uuid, date, int) to authenticated;

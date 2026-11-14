-- Tribes: small groups that see each other's progress and send high fives.
-- Run once in Supabase → SQL Editor. Safe to run again.

create table if not exists public.tribes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tribe_members (
  tribe_id uuid not null references public.tribes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (tribe_id, user_id)
);

-- What a member shows the tribe. Each user writes only their own row.
create table if not exists public.tribe_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  day date,
  done int not null default 0,
  total int not null default 0,
  streak int not null default 0,
  patch_titles text[],
  sprint_number int,
  sprint_theme text,
  score numeric,
  share_patches boolean not null default true,
  share_score boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Feed: active day, all done, release. One of each kind per user per day.
create table if not exists public.tribe_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('active', 'all_done', 'release', 'joined')),
  day date not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, kind, day)
);

create table if not exists public.high_fives (
  event_id bigint not null references public.tribe_events (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, from_user)
);

create index if not exists tribe_members_user on public.tribe_members (user_id);
create index if not exists tribe_events_user_day on public.tribe_events (user_id, day desc);

-- Helpers (security definer so they can look across rows that RLS would hide).
create or replace function public.is_tribe_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tribe_members where tribe_id = t and user_id = auth.uid());
$$;

create or replace function public.shares_tribe(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select other = auth.uid() or exists (
    select 1 from tribe_members a join tribe_members b on a.tribe_id = b.tribe_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.tribe_status enable row level security;
alter table public.tribe_events enable row level security;
alter table public.high_fives enable row level security;

drop policy if exists "members read tribe" on public.tribes;
create policy "members read tribe" on public.tribes for select using (public.is_tribe_member(id));

drop policy if exists "members read members" on public.tribe_members;
create policy "members read members" on public.tribe_members for select using (public.is_tribe_member(tribe_id));
drop policy if exists "leave tribe" on public.tribe_members;
create policy "leave tribe" on public.tribe_members for delete using (user_id = auth.uid());

drop policy if exists "read shared status" on public.tribe_status;
create policy "read shared status" on public.tribe_status for select using (public.shares_tribe(user_id));
drop policy if exists "write own status" on public.tribe_status;
create policy "write own status" on public.tribe_status for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "read shared events" on public.tribe_events;
create policy "read shared events" on public.tribe_events for select using (public.shares_tribe(user_id));
drop policy if exists "write own events" on public.tribe_events;
create policy "write own events" on public.tribe_events for insert with check (user_id = auth.uid());

drop policy if exists "read shared high fives" on public.high_fives;
create policy "read shared high fives" on public.high_fives for select
  using (exists (select 1 from tribe_events e where e.id = event_id and public.shares_tribe(e.user_id)));
drop policy if exists "give high five" on public.high_fives;
create policy "give high five" on public.high_fives for insert with check (
  from_user = auth.uid()
  and exists (select 1 from tribe_events e where e.id = event_id and e.user_id <> auth.uid() and public.shares_tribe(e.user_id))
);
drop policy if exists "take back high five" on public.high_fives;
create policy "take back high five" on public.high_fives for delete using (from_user = auth.uid());

-- Create a tribe with a fresh 6-letter invite code; the creator joins it.
create or replace function public.create_tribe(p_name text) returns public.tribes
language plpgsql security definer set search_path = public as $$
declare t tribes; c text; i int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    -- No 0/O or 1/I/L, so codes are easy to read out loud.
    c := '';
    for i in 1..6 loop
      c := c || substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1);
    end loop;
    exit when not exists (select 1 from tribes where code = c);
  end loop;
  insert into tribes (name, code, created_by) values (trim(p_name), c, auth.uid()) returning * into t;
  insert into tribe_members (tribe_id, user_id) values (t.id, auth.uid());
  return t;
end $$;

-- Join with an invite code. Returns the tribe, or nothing if the code is wrong.
create or replace function public.join_tribe(p_code text) returns public.tribes
language plpgsql security definer set search_path = public as $$
declare t tribes;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into t from tribes where code = upper(trim(p_code));
  if t.id is null then return null; end if;
  insert into tribe_members (tribe_id, user_id) values (t.id, auth.uid()) on conflict do nothing;
  return t;
end $$;

grant execute on function public.create_tribe(text) to authenticated;
grant execute on function public.join_tribe(text) to authenticated;

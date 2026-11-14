-- Admin dashboard: who is admin, admin-only functions, announcements.
-- Run once in Supabase → SQL Editor, AFTER the other migrations. Safe to run again.
-- Admins never get health answers, symptoms or answers from these functions.

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Is this user an admin? (security definer: reads profiles without RLS in the way.)
create or replace function public.is_admin_user(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$;

-- Protect plan and admin flags: the app can't change them; only admins (via the functions below)
-- and the SQL editor can. Nobody can make themselves admin from the app.
create or replace function public.protect_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not public.is_admin_user(auth.uid()) then
    if tg_op = 'INSERT' then
      new.plan := 'free'; new.founder := false; new.pro_since := null; new.is_admin := false;
    else
      new.plan := old.plan; new.founder := old.founder; new.pro_since := old.pro_since; new.is_admin := old.is_admin;
    end if;
  elsif auth.role() = 'authenticated' and tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
    raise exception 'admin flag can only be changed in the database';
  end if;
  return new;
end $$;

drop trigger if exists protect_plan on public.profiles;
create trigger protect_plan before insert or update on public.profiles
  for each row execute function public.protect_plan();

-- Overview numbers only (no names, no answers).
create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; today date := current_date;
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'new_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'active_today', (select count(distinct user_id) from checkins where day = today and item_id <> 'REST'),
    'active_7d', (select count(distinct user_id) from checkins where day > today - 7 and item_id <> 'REST'),
    'plans', (select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from (
      select case when founder then 'founder' when plan = 'pro' then 'pro' else 'free' end as k, count(*) as v
      from profiles group by 1) x),
    'tribes', (select count(*) from tribes),
    'tribe_members', (select count(*) from tribe_members),
    'retention7', (select round(100.0 * count(*) filter (where exists (
        select 1 from checkins c where c.user_id = p.id and c.day > today - 7 and c.item_id <> 'REST')) / nullif(count(*), 0))
      from profiles p where p.created_at < now() - interval '7 days'),
    'top_patches', (select coalesce(jsonb_agg(jsonb_build_object('id', item_id, 'n', n)), '[]'::jsonb) from (
      select item_id, count(*) as n from checkins
      where day > today - 30 and item_id <> 'REST'
      group by item_id order by n desc limit 5) t)
  ) into r;
  return r;
end $$;

-- People list for search. Email is shown to admins only (to find accounts for Pro).
create or replace function public.admin_users(p_search text default '', p_limit int default 50)
returns table (id uuid, email text, name text, plan text, founder boolean, created_at timestamptz, last_active date, active_days int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  return query
  select p.id, u.email::text, p.name, p.plan, p.founder, p.created_at,
    (select max(c.day) from checkins c where c.user_id = p.id and c.item_id <> 'REST') as last_active,
    (select count(distinct c.day)::int from checkins c where c.user_id = p.id and c.item_id <> 'REST') as active_days
  from profiles p join auth.users u on u.id = p.id
  where coalesce(p_search, '') = '' or u.email ilike '%' || p_search || '%' or p.name ilike '%' || p_search || '%'
  order by last_active desc nulls last, p.created_at desc
  limit greatest(1, least(p_limit, 200));
end $$;

-- Give or take Pro by email. Founders stay Pro (their flag is not changed here).
create or replace function public.admin_set_plan(p_email text, p_plan text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  if p_plan not in ('free', 'pro') then raise exception 'plan must be free or pro'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then return 'not_found'; end if;
  update profiles set plan = p_plan, pro_since = case when p_plan = 'pro' then coalesce(pro_since, now()) else null end
    where id = uid;
  return 'ok';
end $$;

-- Tribes: list, delete, remove a member.
create or replace function public.admin_tribes() returns table (id uuid, name text, code text, members int, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  return query
  select t.id, t.name, t.code, (select count(*)::int from tribe_members m where m.tribe_id = t.id), t.created_at
  from tribes t order by t.created_at desc;
end $$;

create or replace function public.admin_delete_tribe(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  delete from tribes where id = p_id;
end $$;

create or replace function public.admin_remove_member(p_tribe uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  delete from tribe_members where tribe_id = p_tribe and user_id = p_user;
end $$;

-- In-app messages from the admin to everyone.
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 400),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "read active messages" on public.announcements;
create policy "read active messages" on public.announcements for select to authenticated using (active);

create or replace function public.admin_publish_message(p_title text, p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare newid bigint;
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  insert into announcements (title, body) values (trim(p_title), trim(p_body)) returning id into newid;
  return newid;
end $$;

-- Only the latest active message is shown to users.
create or replace function public.latest_message() returns table (id bigint, title text, body text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.title, a.body, a.created_at from announcements a where a.active order by a.id desc limit 1;
$$;

revoke execute on function public.admin_stats() from public;
revoke execute on function public.admin_users(text, int) from public;
revoke execute on function public.admin_set_plan(text, text) from public;
revoke execute on function public.admin_tribes() from public;
revoke execute on function public.admin_delete_tribe(uuid) from public;
revoke execute on function public.admin_remove_member(uuid, uuid) from public;
revoke execute on function public.admin_publish_message(text, text) from public;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_users(text, int) to authenticated;
grant execute on function public.admin_set_plan(text, text) to authenticated;
grant execute on function public.admin_tribes() to authenticated;
grant execute on function public.admin_delete_tribe(uuid) to authenticated;
grant execute on function public.admin_remove_member(uuid, uuid) to authenticated;
grant execute on function public.admin_publish_message(text, text) to authenticated;
grant execute on function public.latest_message() to authenticated;

-- ONE-TIME: make your account an admin. Replace the email. Run in SQL Editor only.
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where lower(email) = lower('YOUR_EMAIL@example.com'));

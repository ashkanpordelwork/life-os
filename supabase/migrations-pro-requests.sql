-- Pro requests: users ask for Pro, an admin approves or declines (owner decision).
-- Run once in Supabase → SQL Editor. Safe to run again.

create table if not exists public.pro_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  -- true once the admins got a push about it (set by the pro-notify function)
  notified boolean not null default false
);
-- One open request per person.
create unique index if not exists pro_requests_one_open on public.pro_requests (user_id) where status = 'pending';

alter table public.pro_requests enable row level security;
drop policy if exists "read own pro requests" on public.pro_requests;
create policy "read own pro requests" on public.pro_requests for select using (auth.uid() = user_id);
drop policy if exists "ask for pro" on public.pro_requests;
create policy "ask for pro" on public.pro_requests for insert
  with check (auth.uid() = user_id and status = 'pending' and decided_at is null and notified = false);
-- No update or delete from the app: only the admin function below changes a request.

-- Open requests for the admin dashboard (name and email only; never health answers).
create or replace function public.admin_pro_requests()
returns table (id uuid, user_id uuid, email text, name text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  return query
  select r.id, r.user_id, u.email::text, p.name, r.created_at
  from pro_requests r
  join auth.users u on u.id = r.user_id
  left join profiles p on p.id = r.user_id
  where r.status = 'pending'
  order by r.created_at;
end $$;

-- Approve (gives Pro) or decline a request.
create or replace function public.admin_decide_pro(p_id uuid, p_approve boolean) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin_user(auth.uid()) then raise exception 'not allowed'; end if;
  update pro_requests set status = case when p_approve then 'approved' else 'declined' end, decided_at = now()
    where id = p_id and status = 'pending' returning user_id into uid;
  if uid is null then return 'not_found'; end if;
  if p_approve then
    update profiles set plan = 'pro', pro_since = coalesce(pro_since, now()) where id = uid;
  end if;
  return 'ok';
end $$;

-- Owner decision: everyone who has an account today is Pro. New sign-ups start on Free.
update public.profiles set plan = 'pro', pro_since = coalesce(pro_since, now()) where plan <> 'pro';

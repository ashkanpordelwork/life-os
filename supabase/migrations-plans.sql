-- Plans: free / pro, and "founding member" for everyone who already has an account.
-- Run once in Supabase → SQL Editor. Safe to run again.

alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists founder boolean not null default false;
alter table public.profiles add column if not exists pro_since timestamptz;

-- The app itself may never change these three columns (only the server or this editor can).
create or replace function public.protect_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.plan := 'free'; new.founder := false; new.pro_since := null;
    else
      new.plan := old.plan; new.founder := old.founder; new.pro_since := old.pro_since;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_plan on public.profiles;
create trigger protect_plan before insert or update on public.profiles
  for each row execute function public.protect_plan();

-- Everyone with an account today becomes Pro for good.
update public.profiles
  set plan = 'pro', founder = true, pro_since = coalesce(pro_since, now())
  where founder = false;

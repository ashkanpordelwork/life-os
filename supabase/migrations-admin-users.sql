-- Admin account management: a log of what admins did (who, to whom, what). Only admins can read it.
-- Run once in Supabase → SQL Editor. Safe to run again.
create table if not exists public.admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  target_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_actions enable row level security;
drop policy if exists "admins read log" on public.admin_actions;
create policy "admins read log" on public.admin_actions for select using (public.is_admin_user(auth.uid()));
-- No policies for writing: only the admin-users Edge Function (service key) adds rows.

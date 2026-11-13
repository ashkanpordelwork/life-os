-- Run once in Supabase -> SQL Editor AFTER the send-reminders function is deployed.
-- Replace YOUR_CRON_SECRET with the same value you saved as the CRON_SECRET secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('send-reminders') where exists (select 1 from cron.job where jobname = 'send-reminders');
select cron.schedule(
  'send-reminders',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://uqbslllnctvfegdqaolp.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

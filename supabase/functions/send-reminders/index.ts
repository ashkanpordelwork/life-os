// Supabase Edge Function: sends the daily push reminder.
// Called every 10 minutes by pg_cron (see supabase/cron.sql). Secrets (Edge Functions -> Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WINDOW_MIN = 20; // send if the user's reminder time was in the last 20 minutes
const APP_URL = 'https://ashkanpordelwork.github.io/life-os/';

function localNow(tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });

  webpush.setVapidDetails(APP_URL, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: rows, error } = await sb.from('reminders').select('user_id, remind_at, tz, last_sent_on').eq('push_enabled', true);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const r of rows ?? []) {
    let local;
    try { local = localNow(r.tz || 'UTC'); } catch { local = localNow('UTC'); }
    const [h, m] = String(r.remind_at || '09:00').split(':').map(Number);
    const target = h * 60 + m;
    if (r.last_sent_on === local.date || local.minutes < target || local.minutes >= target + WINDOW_MIN) continue;

    // Skip if today is already done or a rest day.
    const { data: sprint } = await sb.from('sprints').select('patch_ids').eq('user_id', r.user_id).order('number', { ascending: false }).limit(1).maybeSingle();
    const { data: today } = await sb.from('checkins').select('item_id').eq('user_id', r.user_id).eq('day', local.date);
    const ids = new Set((today ?? []).map((c) => c.item_id));
    const total = sprint?.patch_ids?.length ?? 0;
    const left = (sprint?.patch_ids ?? []).filter((id: string) => !ids.has(id)).length;
    await sb.from('reminders').update({ last_sent_on: local.date }).eq('user_id', r.user_id);
    if (!total || left === 0 || ids.has('REST')) continue;

    const payload = JSON.stringify({
      title: 'Life OS',
      body: left === 1 ? '1 small patch left today.' : `${left} small patches today. You've got this.`,
      url: `${APP_URL}#/today`,
    });
    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', r.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});

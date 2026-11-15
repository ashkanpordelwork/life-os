// Instant push for a Tribe nudge (owner decision: it should arrive right away).
// The app calls this after send_nudge() said 'ok':  { type: 'nudge', to: '<user id>', day: 'YYYY-MM-DD' }
// The caller's login is checked here; only the caller's own un-announced nudge is sent, once.
// The nudge is skipped when the receiver has pushes or Tribe pushes off.
// Needs the same secrets as send-reminders: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://ashkanpordelwork.github.io/life-os/';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Same order and wording as tribe.nudge.msgs in src/i18n/en.json.
const MSGS = [
  'Your habits are looking lonely.',
  'Psst. The Tribe is waiting for you.',
  'Just one tiny habit. We believe in you.',
  'Everyone is moving. Are you?',
  'Your streak says hi. Don’t leave it hanging.',
  'Tick one habit and make my day.',
  'I’m ahead of you today. Just saying.',
  'Tiny mode exists. No excuses.',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await sb.auth.getUser(token);
  const caller = auth?.user;
  if (!caller) return reply({ error: 'not signed in' }, 401);

  const body = await req.json().catch(() => ({}));
  if (body.type !== 'nudge' || typeof body.to !== 'string' || typeof body.day !== 'string') return reply({ error: 'bad request' }, 400);

  const { data: nudge } = await sb.from('tribe_nudges').select('id, msg').eq('from_user', caller.id).eq('to_user', body.to).eq('day', body.day).eq('notified', false).maybeSingle();
  if (!nudge) return reply({ sent: 0 });
  await sb.from('tribe_nudges').update({ notified: true }).eq('id', nudge.id);

  // Receiver's push choices (Tribe pushes column exists after migrations-notify.sql).
  let pref = await sb.from('reminders').select('push_enabled, tribe_push').eq('user_id', body.to).maybeSingle();
  if (pref.error) pref = await sb.from('reminders').select('push_enabled').eq('user_id', body.to).maybeSingle() as typeof pref;
  const p = pref.data as { push_enabled?: boolean; tribe_push?: boolean } | null;
  if (!p?.push_enabled || p.tribe_push === false) return reply({ sent: 0 });

  const { data: from } = await sb.from('tribe_status').select('display_name').eq('user_id', caller.id).maybeSingle();
  const name = from?.display_name || 'Someone';
  webpush.setVapidDetails(APP_URL, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const payload = JSON.stringify({ title: `${name} nudged you`, body: MSGS[nudge.msg % MSGS.length], url: `${APP_URL}#/tribe`, tag: `nudge-${caller.id}` });

  let sent = 0;
  const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', body.to);
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
    }
  }
  return reply({ sent });
});

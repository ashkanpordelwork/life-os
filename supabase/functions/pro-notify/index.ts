// Instant pushes for Pro requests (owner decision: the admin hears about a request right away).
// Called by the app right after a user asks for Pro, and after an admin approves or declines.
//   { type: 'request' }            -> push to every admin: "<name> wants Pro"
//   { type: 'decision', id }       -> push to the user: approved or declined
// The caller's login is checked here; nothing is sent on someone else's behalf.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await sb.auth.getUser(token);
  const caller = auth?.user;
  if (!caller) return reply({ error: 'not signed in' }, 401);

  webpush.setVapidDetails(APP_URL, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  let sent = 0;
  const sendTo = async (userId: string, payload: { title: string; body: string; url: string; tag?: string }) => {
    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', userId);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
  };

  const body = await req.json().catch(() => ({}));

  if (body.type === 'request') {
    // Only the caller's own open request, and only once.
    const { data: open } = await sb.from('pro_requests').select('id').eq('user_id', caller.id).eq('status', 'pending').eq('notified', false).maybeSingle();
    if (!open) return reply({ sent });
    const { data: prof } = await sb.from('profiles').select('name').eq('id', caller.id).maybeSingle();
    const who = prof?.name || caller.email || 'Someone';
    const { data: admins } = await sb.from('profiles').select('id').eq('is_admin', true);
    for (const a of admins ?? []) await sendTo(a.id, { title: 'New Pro request', body: `${who} wants Pro. Tap to review.`, url: `${APP_URL}#/admin`, tag: 'pro-request' });
    await sb.from('pro_requests').update({ notified: true }).eq('id', open.id);
    return reply({ sent });
  }

  if (body.type === 'decision' && typeof body.id === 'string') {
    const { data: me } = await sb.from('profiles').select('is_admin').eq('id', caller.id).maybeSingle();
    if (!me?.is_admin) return reply({ error: 'not allowed' }, 403);
    const { data: r } = await sb.from('pro_requests').select('user_id, status').eq('id', body.id).maybeSingle();
    if (!r || r.status === 'pending') return reply({ sent });
    await sendTo(r.user_id, r.status === 'approved'
      ? { title: "You're Pro now", body: 'Every week, every habit and every tool are open. Enjoy!', url: `${APP_URL}#/pro`, tag: 'pro-decision' }
      : { title: 'About your Pro request', body: "Not this time. You can keep going on Free and ask again later.", url: `${APP_URL}#/pro`, tag: 'pro-decision' });
    return reply({ sent });
  }

  return reply({ error: 'bad request' }, 400);
});

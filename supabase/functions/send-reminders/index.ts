// Supabase Edge Function: sends push notifications.
// 1. The daily nudge at the user's chosen time.
// 2. Smart reminders: a push at each patch's own time (times worked out by the app, saved in reminders.patch_times).
// 3. Tribe: a push when someone sends you a high five.
// Sick and vacation modes pause 1 and 2.
// Called every 10 minutes by pg_cron (see supabase/cron.sql). Secrets (Edge Functions -> Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WINDOW_MIN = 20; // send if the target time was in the last 20 minutes
const APP_URL = 'https://ashkanpordelwork.github.io/life-os/';

type PatchTime = { id: string; title: string; at: string; cutoff: boolean };

function localNow(tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
const toMin = (hhmm: string) => { const [h, m] = String(hhmm || '09:00').split(':').map(Number); return h * 60 + m; };
const inWindow = (now: number, target: number) => now >= target && now < target + WINDOW_MIN;

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });

  webpush.setVapidDetails(APP_URL, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
  /** true the first time a key is used for a user on a day; false if it was already sent. */
  const once = async (userId: string, key: string, day: string) => {
    const { error } = await sb.from('push_log').insert({ user_id: userId, key, day });
    return !error;
  };

  // Newer columns exist only after migrations-notify.sql; fall back to the daily nudge alone.
  let smart = true;
  let res = await sb.from('reminders').select('user_id, remind_at, tz, last_sent_on, patch_push, tribe_push, patch_times').eq('push_enabled', true);
  if (res.error) {
    smart = false;
    res = await sb.from('reminders').select('user_id, remind_at, tz, last_sent_on').eq('push_enabled', true);
  }
  if (res.error) return new Response(res.error.message, { status: 500 });
  const rows = (res.data ?? []) as {
    user_id: string; remind_at: string; tz: string; last_sent_on: string | null;
    patch_push?: boolean; tribe_push?: boolean; patch_times?: PatchTime[];
  }[];

  for (const r of rows) {
    let local;
    try { local = localNow(r.tz || 'UTC'); } catch { local = localNow('UTC'); }
    const dailyDue = r.last_sent_on !== local.date && inWindow(local.minutes, toMin(r.remind_at));
    const patchesDue = smart && r.patch_push !== false
      ? (r.patch_times ?? []).filter((p) => inWindow(local.minutes, toMin(p.at)))
      : [];
    if (!dailyDue && patchesDue.length === 0) continue;

    // Sick or vacation mode: no patch reminders (table exists after migrations-modes.sql).
    const { data: paused } = await sb.from('life_modes').select('id').eq('user_id', r.user_id)
      .in('mode', ['sick', 'vacation']).lte('start_day', local.date).gte('end_day', local.date).limit(1);
    if (paused && paused.length) {
      if (dailyDue) await sb.from('reminders').update({ last_sent_on: local.date }).eq('user_id', r.user_id);
      continue;
    }

    const { data: sprint } = await sb.from('sprints').select('patch_ids').eq('user_id', r.user_id).order('number', { ascending: false }).limit(1).maybeSingle();
    const { data: today } = await sb.from('checkins').select('item_id').eq('user_id', r.user_id).eq('day', local.date);
    const done = new Set((today ?? []).map((c) => c.item_id));
    const resting = done.has('REST');
    const ids: string[] = sprint?.patch_ids ?? [];

    // 1. Daily nudge
    if (dailyDue) {
      await sb.from('reminders').update({ last_sent_on: local.date }).eq('user_id', r.user_id);
      const left = ids.filter((id) => !done.has(id)).length;
      if (ids.length && left > 0 && !resting) {
        await sendTo(r.user_id, {
          title: 'Life OS',
          body: left === 1 ? '1 small patch left today.' : `${left} small patches today. You've got this.`,
          url: `${APP_URL}#/today`,
          tag: 'daily',
        });
      }
    }

    // 2. Smart reminders, one per patch per day, only for patches still in the Sprint and not done.
    for (const p of patchesDue) {
      if (resting || done.has(p.id) || !ids.includes(p.id)) continue;
      if (!(await once(r.user_id, `patch:${p.id}`, local.date))) continue;
      await sendTo(r.user_id, {
        title: p.title,
        body: p.cutoff ? `Last call: ${p.title.toLowerCase()} starts now.` : `It's time for ${p.title.toLowerCase()}. Tap when it's done.`,
        url: `${APP_URL}#/patch/${p.id}`,
        tag: `patch-${p.id}`,
      });
    }
  }

  // 3. Tribe high fives not yet notified (last 24 h).
  if (smart) {
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data: fives } = await sb.from('high_fives').select('event_id, from_user').eq('notified', false).gte('created_at', since);
    if (fives && fives.length) {
      const eventIds = [...new Set(fives.map((f) => f.event_id))];
      const { data: events } = await sb.from('tribe_events').select('id, user_id').in('id', eventIds);
      const owner = new Map((events ?? []).map((e) => [e.id, e.user_id as string]));
      const fromIds = [...new Set(fives.map((f) => f.from_user))];
      const { data: names } = await sb.from('tribe_status').select('user_id, display_name').in('user_id', fromIds);
      const nameOf = new Map((names ?? []).map((n) => [n.user_id, n.display_name || 'Someone']));
      const byOwner = new Map<string, string[]>();
      for (const f of fives) {
        const o = owner.get(f.event_id);
        if (!o) continue;
        byOwner.set(o, [...(byOwner.get(o) ?? []), nameOf.get(f.from_user) ?? 'Someone']);
      }
      const prefs = new Map(rows.map((r) => [r.user_id, r.tribe_push !== false]));
      for (const [o, from] of byOwner) {
        if (!prefs.get(o)) continue; // push off, or Tribe pushes off
        const uniq = [...new Set(from)];
        await sendTo(o, {
          title: 'High five',
          body: uniq.length === 1 ? `${uniq[0]} sent you a high five.` : `${uniq[0]} and ${uniq.length - 1} more sent you high fives.`,
          url: `${APP_URL}#/tribe`,
          tag: 'high-five',
        });
      }
      await sb.from('high_fives').update({ notified: true }).in('event_id', eventIds).eq('notified', false);
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});

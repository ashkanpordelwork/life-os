// Account management for admins (owner decision): reset links, resetting progress, suspending, deleting.
// Runs with the service key, so every call first checks that the CALLER is an admin (profiles.is_admin).
// Admins never see health answers, symptoms or passwords here. Passwords can't be read or set by an admin:
// the user always picks their own through a reset link.
// Actions: info | reset_link | send_reset | reset_progress | suspend | delete_user
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://ashkanpordelwork.github.io/life-os/';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Tables with a user's progress. "Reset progress" clears these and keeps the account and profile.
const PROGRESS_TABLES: { table: string; col: string }[] = [
  { table: 'checkins', col: 'user_id' },
  { table: 'sprints', col: 'user_id' },
  { table: 'habit_goals', col: 'user_id' },
  { table: 'daily_logs', col: 'user_id' },
  { table: 'life_modes', col: 'user_id' },
  { table: 'tribe_events', col: 'user_id' },
  { table: 'push_log', col: 'user_id' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await sb.auth.getUser(token);
  const caller = auth?.user;
  if (!caller) return reply({ error: 'not signed in' }, 401);
  const { data: me } = await sb.from('profiles').select('is_admin').eq('id', caller.id).maybeSingle();
  if (!me?.is_admin) return reply({ error: 'not allowed' }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  const userId = typeof body.user_id === 'string' ? body.user_id : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  const log = (target: string | null, what: string) =>
    sb.from('admin_actions').insert({ admin_id: caller.id, target_id: target, action: what }).then(() => {}, () => {});
  const isAdmin = async (id: string) => !!(await sb.from('profiles').select('is_admin').eq('id', id).maybeSingle()).data?.is_admin;

  if (action === 'info') {
    const { data, error } = await sb.auth.admin.getUserById(userId);
    if (error || !data.user) return reply({ error: 'not found' }, 404);
    const u = data.user;
    return reply({
      confirmed: !!u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      suspended: !!u.banned_until && new Date(u.banned_until).getTime() > Date.now(),
      is_admin: await isAdmin(u.id),
    });
  }

  if (action === 'reset_link' || action === 'send_reset') {
    if (!email) return reply({ error: 'email needed' }, 400);
    if (action === 'send_reset') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: APP_URL });
      await log(null, 'send_reset');
      return error ? reply({ error: error.message }, 400) : reply({ ok: true });
    }
    const { data, error } = await sb.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: APP_URL } });
    if (error || !data?.properties?.hashed_token) return reply({ error: error?.message ?? 'no link' }, 400);
    await log(data.user?.id ?? null, 'reset_link');
    // Our own link: the app swaps the token for a session and asks for a new password. One use, about 1 hour.
    return reply({ link: `${APP_URL}?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery` });
  }

  // From here on the target must be someone else and not an admin.
  if (!userId) return reply({ error: 'user needed' }, 400);
  if (userId === caller.id || (await isAdmin(userId))) return reply({ error: 'admin' }, 400);

  if (action === 'reset_progress') {
    for (const { table, col } of PROGRESS_TABLES) await sb.from(table).delete().eq(col, userId); // a missing table is skipped
    await log(userId, 'reset_progress');
    return reply({ ok: true });
  }

  if (action === 'suspend') {
    const on = body.on === true;
    const { error } = await sb.auth.admin.updateUserById(userId, { ban_duration: on ? '876000h' : 'none' });
    if (error) return reply({ error: error.message }, 400);
    await log(userId, on ? 'suspend' : 'unsuspend');
    return reply({ ok: true });
  }

  if (action === 'delete_user') {
    // Everything of theirs goes with the account (the tables cascade from the user).
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) return reply({ error: error.message }, 400);
    await log(null, 'delete_user');
    return reply({ ok: true });
  }

  return reply({ error: 'bad request' }, 400);
});

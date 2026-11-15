import { createClient, type AuthError as SbAuthError, type User } from '@supabase/supabase-js';
import type { Sprint } from '../data/types';
import type { LifeMode } from '../engine';
import { AuthError, type AuthErrorCode, type Backend, type Checkin, type AdminProRequest, type AdminUserInfo, type ProRequest, type AdminStats, type AdminUser, type AdminTribe, type Announcement, type NudgeResult, type ReactionKind, type TribeNudge, type TribeReaction, type ReminderPrefs, type Tribe, type TribeEvent, type TribeStatus, type UserInfo } from './types';

/** Supabase backend. Tables and security rules: supabase/schema.sql */
export function createSupabaseBackend(url: string, anonKey: string): Backend {
  // PKCE: the email link comes back as ?code=... (not #access_token=...), so it does not clash with the
// app's #/ routes. supabase-js exchanges the code for a session on load.
  const sb = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  });
  // After the code is used, remove it from the address bar.
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') markRecovery();
    if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  });
  // A reset link was opened (from the email, or one an admin sent): the app must ask for a new password.
  let recovering = false;
  const recoveryListeners = new Set<() => void>();
  function markRecovery() { recovering = true; recoveryListeners.forEach((f) => f()); }
  // Admin-made link: ?token_hash=...&type=recovery. Swap the token for a session, then ask for the password.
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('type') === 'recovery' && qs.get('token_hash')) {
    const tokenHash = qs.get('token_hash')!;
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    sb.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => { if (!error) markRecovery(); }).catch(() => {});
  }

  const toInfo = (u: User): UserInfo => ({
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.name as string | undefined) ?? '',
  });

  const fail = (e: SbAuthError | Error | null): never => {
    const msg = (e?.message ?? '').toLowerCase();
    let code: AuthErrorCode = 'unknown';
    if (msg.includes('invalid login')) code = 'invalid';
    else if (msg.includes('already registered') || msg.includes('already been registered')) code = 'exists';
    else if (msg.includes('password')) code = 'weak';
    else if (msg.includes('email not confirmed')) code = 'confirm';
    else if (msg.includes('email')) code = 'email';
    else if (msg.includes('fetch') || msg.includes('network')) code = 'network';
    throw new AuthError(code);
  };

  const check = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
    if (error) throw new Error(error.message);
    return data;
  };

  /** One call to the admin-users Edge Function (it checks the caller is an admin). */
  async function adminCall<T = unknown>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await sb.functions.invoke('admin-users', { body });
    if (error) {
      // The function answers { error } with a 4xx: read it so the admin sees the reason.
      let reason = error.message;
      try { const j = await (error as { context?: Response }).context?.json(); if (j?.error) reason = String(j.error); } catch { /* keep the generic one */ }
      throw new Error(reason);
    }
    return data as T;
  }

  return {
    mode: 'supabase',
    async getUser() {
      const { data } = await sb.auth.getSession();
      return data.session?.user ? toInfo(data.session.user) : null;
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user ? toInfo(session.user) : null));
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password, name) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) fail(error);
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new AuthError('exists');
      return data.session?.user ? toInfo(data.session.user) : null;
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error || !data.user) return fail(error);
      return toInfo(data.user);
    },
    async signOut() {
      await sb.auth.signOut();
    },
    onPasswordRecovery(cb) {
      recoveryListeners.add(cb);
      if (recovering) cb();
      return () => { recoveryListeners.delete(cb); };
    },
    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) fail(error);
    },
    async resetPassword(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
      if (error) fail(error);
    },
    async loadProfile(userId) {
      // The extra columns come from a later schema update. If it hasn't been run yet, fall back.
      let res = await sb.from('profiles').select('name, symptoms, answers, start_answers, wake_time, bed_time, health, plan, founder, pro_since, is_admin').eq('id', userId).maybeSingle();
      if (res.error) res = await sb.from('profiles').select('name, symptoms, answers, start_answers, wake_time, bed_time, health, plan, founder, pro_since').eq('id', userId).maybeSingle();
      if (res.error) res = await sb.from('profiles').select('name, symptoms, answers, start_answers, wake_time, bed_time, health').eq('id', userId).maybeSingle();
      if (res.error) res = await sb.from('profiles').select('name, symptoms, answers').eq('id', userId).maybeSingle();
      const row = check(res) as Record<string, any> | null;
      if (!row) return null;
      return {
        name: row.name ?? '', symptoms: row.symptoms ?? [], answers: row.answers ?? {},
        start_answers: row.start_answers ?? undefined, wake_time: row.wake_time ?? undefined, bed_time: row.bed_time ?? undefined,
        health: row.health ?? undefined,
        plan: row.plan ?? undefined, founder: row.founder ?? undefined, pro_since: row.pro_since ?? undefined, is_admin: row.is_admin ?? false,
      };
    },
    async saveProfile(userId, p) {
      const base = { id: userId, name: p.name, symptoms: p.symptoms, answers: p.answers };
      const full = { ...base, start_answers: p.start_answers ?? null, wake_time: p.wake_time ?? null, bed_time: p.bed_time ?? null, health: p.health ?? null };
      const res = await sb.from('profiles').upsert(full);
      if (res.error && /column|schema/i.test(res.error.message)) check(await sb.from('profiles').upsert(base));
      else check(res);
    },
    async loadSprint(userId) {
      const row = check(
        await sb.from('sprints').select('number, theme, length_days, patch_ids, started_at')
          .eq('user_id', userId).order('number', { ascending: false }).limit(1).maybeSingle(),
      );
      return (row as Sprint | null) ?? null;
    },
    async saveSprint(userId, s) {
      check(await sb.from('sprints').upsert({ user_id: userId, ...s }, { onConflict: 'user_id,number' }));
    },
    async loadCheckins(userId) {
      // amount comes from migrations-goals.sql; fall back if it hasn't been run yet.
      let res: { data: unknown; error: { message: string } | null } = await sb.from('checkins').select('day, item_id, version, amount').eq('user_id', userId);
      if (res.error) res = await sb.from('checkins').select('day, item_id, version').eq('user_id', userId);
      return ((check(res) ?? []) as Checkin[]).map((c) => (c.amount == null ? { day: c.day, item_id: c.item_id, version: c.version } : { ...c, amount: Number(c.amount) }));
    },
    async setCheckin(userId, c, done) {
      if (done) {
        const res = await sb.from('checkins').upsert({ user_id: userId, ...c, amount: c.amount ?? null }, { onConflict: 'user_id,day,item_id' });
        // Without the amount column (migration not run), save the tick alone.
        if (res.error && /amount|column|schema/i.test(res.error.message)) {
          check(await sb.from('checkins').upsert({ user_id: userId, day: c.day, item_id: c.item_id, version: c.version }, { onConflict: 'user_id,day,item_id' }));
        } else check(res);
      }
      else check(await sb.from('checkins').delete().match({ user_id: userId, day: c.day, item_id: c.item_id }));
    },
    async loadReminders(userId) {
      // Newer columns may be missing until migrations-notify.sql has been run.
      let res = await sb.from('reminders').select('push_enabled, inapp_enabled, remind_at, tz, patch_push, tribe_push, patch_times').eq('user_id', userId).maybeSingle();
      if (res.error) res = await sb.from('reminders').select('push_enabled, inapp_enabled, remind_at, tz').eq('user_id', userId).maybeSingle();
      return (check(res) as ReminderPrefs | null) ?? null;
    },
    async saveReminders(userId, prefs) {
      const res = await sb.from('reminders').upsert({ user_id: userId, ...prefs });
      if (res.error && /column|schema/i.test(res.error.message)) {
        const { push_enabled, inapp_enabled, remind_at, tz } = prefs;
        check(await sb.from('reminders').upsert({ user_id: userId, push_enabled, inapp_enabled, remind_at, tz }));
      } else check(res);
    },
    async savePushSubscription(userId, sub) {
      check(await sb.from('push_subscriptions').upsert({ user_id: userId, ...sub }));
    },
    async deletePushSubscription(_userId, endpoint) {
      check(await sb.from('push_subscriptions').delete().eq('endpoint', endpoint));
    },
    async loadGoals(userId) {
      const res = await sb.from('habit_goals').select('item_id, goal').eq('user_id', userId);
      if (res.error) return {}; // table missing until migrations-goals.sql is run
      return Object.fromEntries((res.data ?? []).map((r: { item_id: string; goal: number }) => [r.item_id, Number(r.goal)]));
    },
    async saveGoal(userId, itemId, goal) {
      check(await sb.from('habit_goals').upsert({ user_id: userId, item_id: itemId, goal }, { onConflict: 'user_id,item_id' }));
    },
    async loadModes(userId) {
      const res = await sb.from('life_modes').select('id, mode, start_day, end_day').eq('user_id', userId).order('start_day', { ascending: false }).limit(60);
      if (res.error) return []; // table missing until migrations-modes.sql is run
      return res.data as LifeMode[];
    },
    async saveMode(userId, m) {
      check(await sb.from('life_modes').upsert({ ...m, user_id: userId }));
    },
    async latestMessage() {
      const res = await sb.rpc('latest_message');
      if (res.error) return null;
      const row = (res.data as Announcement[] | null)?.[0];
      return row ?? null;
    },
    pro: {
      async mine(userId) {
        const res = await sb.from('pro_requests').select('id, status, created_at, decided_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (res.error) return null; // table missing until migrations-pro-requests.sql is run
        return (res.data as ProRequest | null) ?? null;
      },
      async ask(userId) {
        const row = check(await sb.from('pro_requests').insert({ user_id: userId }).select('id, status, created_at, decided_at').single()) as ProRequest;
        // Instant push to the admins (never blocks the user).
        sb.functions.invoke('pro-notify', { body: { type: 'request' } }).catch(() => {});
        return row;
      },
    },
    admin: {
      async stats() { return check(await sb.rpc('admin_stats')) as AdminStats; },
      async users(search) { return check(await sb.rpc('admin_users', { p_search: search, p_limit: 50 })) as AdminUser[]; },
      async setPlan(email, plan) { return check(await sb.rpc('admin_set_plan', { p_email: email, p_plan: plan })) as 'ok' | 'not_found'; },
      async tribes() { return check(await sb.rpc('admin_tribes')) as AdminTribe[]; },
      async deleteTribe(id) { check(await sb.rpc('admin_delete_tribe', { p_id: id })); },
      async removeMember(tribeId, userId) { check(await sb.rpc('admin_remove_member', { p_tribe: tribeId, p_user: userId })); },
      async publish(title, body) { check(await sb.rpc('admin_publish_message', { p_title: title, p_body: body })); },
      async userInfo(id) { return adminCall<AdminUserInfo>({ action: 'info', user_id: id }); },
      async sendReset(email) { await adminCall({ action: 'send_reset', email }); },
      async resetLink(email) { return (await adminCall<{ link: string }>({ action: 'reset_link', email })).link; },
      async resetProgress(id) { await adminCall({ action: 'reset_progress', user_id: id }); },
      async suspend(id, on) { await adminCall({ action: 'suspend', user_id: id, on }); },
      async deleteUser(id) { await adminCall({ action: 'delete_user', user_id: id }); },
      async proRequests() { return (check(await sb.rpc('admin_pro_requests')) ?? []) as AdminProRequest[]; },
      async decidePro(id, approve) {
        const res = check(await sb.rpc('admin_decide_pro', { p_id: id, p_approve: approve })) as 'ok' | 'not_found';
        if (res === 'ok') sb.functions.invoke('pro-notify', { body: { type: 'decision', id } }).catch(() => {});
        return res;
      },
    },
    tribes: {
      async myTribes(userId) {
        const rows = check(await sb.from('tribe_members').select('tribes(id, name, code, created_by)').eq('user_id', userId)) as unknown as { tribes: Tribe | null }[];
        return rows.map((r) => r.tribes).filter((x): x is Tribe => !!x);
      },
      async detail(tribeId, sinceDay) {
        const tribe = check(await sb.from('tribes').select('id, name, code, created_by').eq('id', tribeId).single()) as Tribe;
        const members = (check(await sb.from('tribe_members').select('user_id').eq('tribe_id', tribeId)) as { user_id: string }[]).map((m) => m.user_id);
        const [statuses, events, reacts, nudged] = await Promise.all([
          sb.from('tribe_status').select('*').in('user_id', members),
          sb.from('tribe_events').select('*').in('user_id', members).gte('day', sinceDay).order('created_at', { ascending: false }).limit(600),
          sb.from('tribe_reactions').select('from_user, to_user, event_id, day, kind').in('to_user', members).gte('day', sinceDay).limit(1500),
          sb.from('tribe_nudges').select('from_user, to_user, day, msg').gte('day', sinceDay).limit(200),
        ]);
        // The new tables exist after migrations-tribe-play.sql; until then there are just none.
        const reactions = (reacts.error ? [] : reacts.data ?? []) as TribeReaction[];
        const nudges = (nudged.error ? [] : nudged.data ?? []) as TribeNudge[];
        return { tribe, members, statuses: check(statuses) as TribeStatus[], events: check(events) as TribeEvent[], reactions, nudges };
      },
      async create(name) {
        return check(await sb.rpc('create_tribe', { p_name: name })) as Tribe;
      },
      async join(code) {
        const t = check(await sb.rpc('join_tribe', { p_code: code })) as Tribe | null;
        return t && t.id ? t : null;
      },
      async leave(userId, tribeId) {
        check(await sb.from('tribe_members').delete().eq('tribe_id', tribeId).eq('user_id', userId));
      },
      async myStatus(userId) {
        return check(await sb.from('tribe_status').select('*').eq('user_id', userId).maybeSingle()) as TribeStatus | null;
      },
      async publishStatus(status) {
        const row = { ...status, updated_at: new Date().toISOString() };
        const res = await sb.from('tribe_status').upsert(row);
        // allow_nudges comes from migrations-tribe-play.sql; until then save without it.
        if (res.error && /allow_nudges|share_nudges|column|schema/i.test(res.error.message)) {
          const { allow_nudges: _a, share_nudges: _b, ...rest } = row;
          check(await sb.from('tribe_status').upsert(rest));
        } else check(res);
      },
      async logEvent(userId, kind, day, payload = {}) {
        // One of each kind per user per day; a repeat is ignored.
        const res = await sb.from('tribe_events').insert({ user_id: userId, kind, day, payload });
        if (res.error && !/duplicate|unique/i.test(res.error.message)) throw new Error(res.error.message);
      },
      async react(userId, to, target, kind: ReactionKind, on) {
        if (on) {
          const res = await sb.from('tribe_reactions').insert({ from_user: userId, to_user: to, event_id: target.eventId ?? null, day: target.day, kind });
          if (res.error && !/duplicate|unique/i.test(res.error.message)) throw new Error(res.error.message);
        } else {
          let q = sb.from('tribe_reactions').delete().eq('from_user', userId).eq('to_user', to).eq('day', target.day).eq('kind', kind);
          q = target.eventId != null ? q.eq('event_id', target.eventId) : q.is('event_id', null);
          check(await q);
        }
      },
      async nudge(to, day, msg) {
        const res = check(await sb.rpc('send_nudge', { p_to: to, p_day: day, p_msg: msg })) as NudgeResult;
        // Instant push to the receiver (never blocks the sender).
        if (res === 'ok') sb.functions.invoke('tribe-notify', { body: { type: 'nudge', to, day } }).catch(() => {});
        return res;
      },
    },
  };
}

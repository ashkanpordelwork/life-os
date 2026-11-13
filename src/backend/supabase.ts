import { createClient, type AuthError as SbAuthError, type User } from '@supabase/supabase-js';
import type { Sprint } from '../data/types';
import { AuthError, type AuthErrorCode, type Backend, type UserInfo } from './types';

/** Supabase backend. Tables and security rules: supabase/schema.sql */
export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });

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
    async resetPassword(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
      if (error) fail(error);
    },
    async loadProfile(userId) {
      const row = check(await sb.from('profiles').select('name, symptoms, answers').eq('id', userId).maybeSingle());
      return row ? { name: row.name ?? '', symptoms: row.symptoms ?? [], answers: row.answers ?? {} } : null;
    },
    async saveProfile(userId, p) {
      check(await sb.from('profiles').upsert({ id: userId, name: p.name, symptoms: p.symptoms, answers: p.answers }));
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
      return check(await sb.from('checkins').select('day, item_id, version').eq('user_id', userId)) ?? [];
    },
    async setCheckin(userId, c, done) {
      if (done) check(await sb.from('checkins').upsert({ user_id: userId, ...c }, { onConflict: 'user_id,day,item_id' }));
      else check(await sb.from('checkins').delete().match({ user_id: userId, day: c.day, item_id: c.item_id }));
    },
  };
}

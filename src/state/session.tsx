import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { backend, type Checkin, type Profile, type ReminderPrefs, type UserInfo } from '../backend';
import { localTimeZone } from './push';
import type { Sprint, VersionKey } from '../data/types';
import { REST_ID, dayKey } from '../engine';
import { DEFAULT_BED, DEFAULT_WAKE, useOnboarding } from './onboarding';

interface SessionState {
  /** false until we know whether someone is logged in */
  ready: boolean;
  user: UserInfo | null;
  profile: Profile | null;
  sprint: Sprint | null;
  checkins: Checkin[];
  reminders: ReminderPrefs;
}

const DEFAULT_REMINDERS: ReminderPrefs = { push_enabled: false, inapp_enabled: true, remind_at: '09:00', tz: 'UTC' };

interface SessionApi extends SessionState {
  mode: 'local' | 'supabase';
  today: string;
  /** Returns 'confirm' when Supabase asks the user to confirm their email first. */
  signUp: (email: string, password: string, name: string) => Promise<'ok' | 'confirm'>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  saveSprint: (sprint: Sprint) => Promise<void>;
  /** Tick or untick a patch for today. Ticking on a rest day ends the rest day. */
  setDone: (itemId: string, done: boolean, version?: VersionKey) => Promise<void>;
  /** Log (or remove) today's rest day. */
  setRest: (on: boolean) => Promise<void>;
  saveReminders: (prefs: Partial<ReminderPrefs>) => Promise<void>;
  /** Change part of the profile (e.g. sleep times, new answers at Release). */
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  /** The user's wake and bed time, with safe defaults. */
  wake: string;
  bed: string;
}

const Ctx = createContext<SessionApi | null>(null);
const EMPTY: SessionState = { ready: false, user: null, profile: null, sprint: null, checkins: [], reminders: DEFAULT_REMINDERS };

export function SessionProvider({ children }: { children: ReactNode }) {
  const { state: draft } = useOnboarding();
  const [s, setS] = useState<SessionState>(EMPTY);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = s.user?.id ?? null;

  /** Load the user's data. The first time, copy the onboarding answers and Sprint into their account. */
  const load = useCallback(async (user: UserInfo | null) => {
    if (!user) { setS({ ...EMPTY, ready: true }); return; }
    let [profile, sprint, checkins] = await Promise.all([
      backend.loadProfile(user.id), backend.loadSprint(user.id), backend.loadCheckins(user.id),
    ]);
    const reminders = (await backend.loadReminders(user.id).catch(() => null)) ?? { ...DEFAULT_REMINDERS, tz: localTimeZone() };
    const d = draftRef.current;
    if (!profile || (!sprint && d.sprint)) {
      profile = {
        name: user.name || profile?.name || '', symptoms: d.symptoms, answers: d.answers,
        start_answers: d.answers, wake_time: d.wake_time, bed_time: d.bed_time,
      };
      await backend.saveProfile(user.id, profile);
    }
    if (!sprint && d.sprint) {
      sprint = d.sprint;
      await backend.saveSprint(user.id, sprint);
    }
    setS({ ready: true, user, profile, sprint, checkins, reminders });
  }, []);

  useEffect(() => {
    let alive = true;
    backend.getUser().then((u) => { if (alive) load(u); }).catch(() => { if (alive) setS({ ...EMPTY, ready: true }); });
    // e.g. coming back from the email confirmation link, or logging out in another tab
    const off = backend.onAuthChange((u) => {
      if (!alive || (u?.id ?? null) === (userIdRef.current ?? null)) return;
      load(u);
    });
    return () => { alive = false; off(); };
  }, [load]);

  const api = useMemo<SessionApi>(() => ({
    ...s,
    mode: backend.mode,
    today: dayKey(new Date()),
    wake: s.profile?.wake_time ?? draft.wake_time ?? DEFAULT_WAKE,
    bed: s.profile?.bed_time ?? draft.bed_time ?? DEFAULT_BED,
    async updateProfile(patch) {
      if (!s.user || !s.profile) return;
      const next = { ...s.profile, ...patch };
      setS((p) => ({ ...p, profile: next }));
      await backend.saveProfile(s.user.id, next);
    },
    async signUp(email, password, name) {
      const user = await backend.signUp(email, password, name);
      if (!user) return 'confirm';
      await load(user);
      return 'ok';
    },
    async signIn(email, password) {
      await load(await backend.signIn(email, password));
    },
    async signOut() {
      await backend.signOut();
      setS({ ...EMPTY, ready: true });
    },
    resetPassword: (email) => backend.resetPassword(email),
    async saveSprint(sprint) {
      if (!s.user) return;
      await backend.saveSprint(s.user.id, sprint);
      setS((p) => ({ ...p, sprint }));
    },
    async setDone(itemId, done, version = 'standard') {
      if (!s.user) return;
      const c: Checkin = { day: dayKey(new Date()), item_id: itemId, version };
      const before = s.checkins;
      // Update the screen first, then save. Undo if saving fails.
      setS((p) => ({
        ...p,
        checkins: done
          ? [...p.checkins.filter((x) => !(x.day === c.day && x.item_id === itemId)), c]
          : p.checkins.filter((x) => !(x.day === c.day && x.item_id === itemId)),
      }));
      const wasResting = done && before.some((x) => x.day === c.day && x.item_id === REST_ID);
      if (wasResting) setS((p) => ({ ...p, checkins: p.checkins.filter((x) => !(x.day === c.day && x.item_id === REST_ID)) }));
      try {
        await backend.setCheckin(s.user.id, c, done);
        if (wasResting) await backend.setCheckin(s.user.id, { day: c.day, item_id: REST_ID, version: 'standard' }, false);
      } catch {
        setS((p) => ({ ...p, checkins: before }));
      }
    },
    async saveReminders(prefs) {
      if (!s.user) return;
      const next = { ...s.reminders, ...prefs, tz: localTimeZone() };
      setS((p) => ({ ...p, reminders: next }));
      await backend.saveReminders(s.user.id, next);
    },
    async setRest(on) {
      if (!s.user) return;
      const c: Checkin = { day: dayKey(new Date()), item_id: REST_ID, version: 'standard' };
      const before = s.checkins;
      setS((p) => ({ ...p, checkins: on ? [...p.checkins.filter((x) => !(x.day === c.day && x.item_id === REST_ID)), c] : p.checkins.filter((x) => !(x.day === c.day && x.item_id === REST_ID)) }));
      try {
        await backend.setCheckin(s.user.id, c, on);
      } catch {
        setS((p) => ({ ...p, checkins: before }));
      }
    },
  }), [s, load, draft.wake_time, draft.bed_time]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useSession must be used inside SessionProvider');
  return api;
}

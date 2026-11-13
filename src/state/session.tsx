import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { backend, type Checkin, type Profile, type UserInfo } from '../backend';
import type { Sprint, VersionKey } from '../data/types';
import { REST_ID, dayKey } from '../engine';
import { useOnboarding } from './onboarding';

interface SessionState {
  /** false until we know whether someone is logged in */
  ready: boolean;
  user: UserInfo | null;
  profile: Profile | null;
  sprint: Sprint | null;
  checkins: Checkin[];
}

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
}

const Ctx = createContext<SessionApi | null>(null);
const EMPTY: SessionState = { ready: false, user: null, profile: null, sprint: null, checkins: [] };

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
    const d = draftRef.current;
    if (!profile || (!sprint && d.sprint)) {
      profile = { name: user.name || profile?.name || '', symptoms: d.symptoms, answers: d.answers };
      await backend.saveProfile(user.id, profile);
    }
    if (!sprint && d.sprint) {
      sprint = d.sprint;
      await backend.saveSprint(user.id, sprint);
    }
    setS({ ready: true, user, profile, sprint, checkins });
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
  }), [s, load]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useSession must be used inside SessionProvider');
  return api;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { backend, type Announcement, type Checkin, type Profile, type ReminderPrefs, type TribeEventKind, type UserInfo } from '../backend';
import { localTimeZone } from './push';
import { SPRINT_DAYS, type ChecklistItem, type Sprint, type VersionKey } from '../data/types';
import { REST_ID, dayKey, patchTimes } from '../engine';
import { getItem } from '../data';
import { DEFAULT_BED, DEFAULT_WAKE, useOnboarding } from './onboarding';

const SEEN_KEY = 'lifeos.seenMessage';
import { planState, type PlanState } from './plan';
import { buildStatus, dailyPatches, type ShareSettings } from './tribeStatus';

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
  /** founder / pro / beta / free (src/state/plan.ts). */
  plan: PlanState;
  /** Tribes (live app only). */
  tribesEnabled: boolean;
  tribeCount: number;
  share: ShareSettings;
  setShare: (s: Partial<ShareSettings>) => Promise<void>;
  /** Re-read how many Tribes the user is in (after create, join or leave). */
  refreshTribes: () => Promise<void>;
  /** Admin dashboard access (set in the database). */
  isAdmin: boolean;
  /** Latest admin message the user hasn't dismissed yet. */
  message: Announcement | null;
  dismissMessage: () => void;
}

const Ctx = createContext<SessionApi | null>(null);
const EMPTY: SessionState = { ready: false, user: null, profile: null, sprint: null, checkins: [], reminders: DEFAULT_REMINDERS };

export function SessionProvider({ children }: { children: ReactNode }) {
  const { state: draft } = useOnboarding();
  const [s, setS] = useState<SessionState>(EMPTY);
  const [tribeCount, setTribeCount] = useState(0);
  const [share, setShareState] = useState<ShareSettings>({ patches: true, score: true });
  const [latest, setLatest] = useState<Announcement | null>(null);
  const [seenId, setSeenId] = useState<number>(() => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; } });
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
        start_answers: d.answers, wake_time: d.wake_time, bed_time: d.bed_time, health: d.health,
      };
      await backend.saveProfile(user.id, profile);
    }
    if (!sprint && d.sprint) {
      sprint = d.sprint;
      await backend.saveSprint(user.id, sprint);
    }
    // Owner decision: every Sprint is 7 days now, also ones started as 14.
    if (sprint && sprint.length_days !== SPRINT_DAYS) sprint = { ...sprint, length_days: SPRINT_DAYS };
    setS({ ready: true, user, profile, sprint, checkins, reminders });
    backend.latestMessage().then(setLatest).catch(() => setLatest(null));
    // Tribes: how many, and this user's sharing choices. Never blocks loading.
    if (backend.tribes) {
      backend.tribes.myTribes(user.id).then((t) => setTribeCount(t.length)).catch(() => {});
      backend.tribes.myStatus(user.id).then((st) => { if (st) setShareState({ patches: st.share_patches, score: st.share_score }); }).catch(() => {});
    }
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

  // Keep this user's Tribe snapshot fresh (debounced) while they are in a Tribe.
  useEffect(() => {
    if (!backend.tribes || !s.user || tribeCount === 0) return;
    const user = s.user;
    const id = setTimeout(() => {
      backend.tribes!.publishStatus(buildStatus(user.id, s.profile, s.sprint, s.checkins, dayKey(new Date()), share)).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [s.user, s.profile, s.sprint, s.checkins, tribeCount, share]);

  // Smart reminders: keep today's patch times on the server, so pushes arrive at each patch's own time.
  const wakeNow = s.profile?.wake_time ?? draft.wake_time ?? DEFAULT_WAKE;
  const bedNow = s.profile?.bed_time ?? draft.bed_time ?? DEFAULT_BED;
  useEffect(() => {
    if (!s.user || !s.reminders.push_enabled) return;
    const items = (s.sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x);
    const times = patchTimes(items, wakeNow, bedNow);
    if (JSON.stringify(times) === JSON.stringify(s.reminders.patch_times ?? [])) return;
    const next = { ...s.reminders, patch_times: times, tz: localTimeZone() };
    setS((p) => ({ ...p, reminders: next }));
    backend.saveReminders(s.user.id, next).catch(() => {});
  }, [s.user, s.sprint, s.reminders, wakeNow, bedNow]);

  /** Feed events for Tribes. Fire-and-forget. */
  const logTribe = useCallback((kind: TribeEventKind, payload?: Record<string, unknown>) => {
    const uid = userIdRef.current;
    if (!backend.tribes || !uid || tribeCountRef.current === 0) return;
    backend.tribes.logEvent(uid, kind, dayKey(new Date()), payload).catch(() => {});
  }, []);
  const tribeCountRef = useRef(0);
  tribeCountRef.current = tribeCount;

  const api = useMemo<SessionApi>(() => ({
    ...s,
    mode: backend.mode,
    today: dayKey(new Date()),
    wake: s.profile?.wake_time ?? draft.wake_time ?? DEFAULT_WAKE,
    bed: s.profile?.bed_time ?? draft.bed_time ?? DEFAULT_BED,
    plan: planState(s.profile),
    isAdmin: !!s.profile?.is_admin,
    message: latest && latest.id > seenId ? latest : null,
    dismissMessage() {
      if (!latest) return;
      setSeenId(latest.id);
      try { localStorage.setItem(SEEN_KEY, String(latest.id)); } catch { /* ignore */ }
    },
    tribesEnabled: !!backend.tribes,
    tribeCount,
    share,
    async setShare(next) {
      setShareState((p) => ({ ...p, ...next }));
    },
    async refreshTribes() {
      if (!backend.tribes || !s.user) return;
      setTribeCount((await backend.tribes.myTribes(s.user.id)).length);
    },
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
      if (s.sprint && sprint.number > s.sprint.number) logTribe('release', { number: s.sprint.number, theme: s.sprint.theme ?? null });
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
      if (done && itemId !== REST_ID) {
        const daily = dailyPatches(s.sprint).map((i) => i.id);
        const doneNow = new Set([...before.filter((x) => x.day === c.day && x.item_id !== REST_ID).map((x) => x.item_id), itemId]);
        logTribe('active');
        if (daily.length && daily.every((id) => doneNow.has(id))) logTribe('all_done');
      }
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
  }), [s, load, draft.wake_time, draft.bed_time, tribeCount, share, logTribe, latest, seenId]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useSession must be used inside SessionProvider');
  return api;
}

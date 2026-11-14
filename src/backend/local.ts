import type { Sprint } from '../data/types';
import type { DailyLog, Experiment, LifeMode } from '../engine';
import { AuthError, type Backend, type Checkin, type Profile, type ReminderPrefs, type UserInfo } from './types';

/**
 * Local backend: everything stays in this browser's localStorage.
 * Used only when Supabase is not configured (development and tests). Not secure; not for real users.
 */
const USERS = 'lifeos.local.users';
const SESSION = 'lifeos.local.session';
const dataKey = (id: string) => `lifeos.local.data.${id}`;

interface StoredUser { id: string; email: string; name: string; hash: string }
interface StoredData { profile: Profile | null; sprint: Sprint | null; checkins: Checkin[]; reminders?: ReminderPrefs | null; logs?: DailyLog[]; experiments?: Experiment[]; modes?: LifeMode[] }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
}

async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

const listeners = new Set<(u: UserInfo | null) => void>();
const emit = (u: UserInfo | null) => listeners.forEach((l) => l(u));
const toInfo = (u: StoredUser): UserInfo => ({ id: u.id, email: u.email, name: u.name });

function data(id: string): StoredData {
  return read<StoredData>(dataKey(id), { profile: null, sprint: null, checkins: [] });
}

export const localBackend: Backend = {
  tribes: null,
  admin: null,
  async latestMessage() { return null; },
  async loadLogs(id) { return data(id).logs ?? []; },
  async saveLog(id, log) { const d = data(id); write(dataKey(id), { ...d, logs: [...(d.logs ?? []).filter((l) => l.day !== log.day), log] }); },
  async loadExperiments(id) { return data(id).experiments ?? []; },
  async saveExperiment(id, e) { const d = data(id); write(dataKey(id), { ...d, experiments: [...(d.experiments ?? []).filter((x) => x.id !== e.id), e] }); },
  async loadModes(id) { return data(id).modes ?? []; },
  async saveMode(id, m) { const d = data(id); write(dataKey(id), { ...d, modes: [...(d.modes ?? []).filter((x) => x.id !== m.id), m] }); },
  async deleteExperiment(id, eid) { const d = data(id); write(dataKey(id), { ...d, experiments: (d.experiments ?? []).filter((x) => x.id !== eid) }); },
  mode: 'local',
  async getUser() {
    const id = read<string | null>(SESSION, null);
    const user = Object.values(read<Record<string, StoredUser>>(USERS, {})).find((u) => u.id === id);
    return user ? toInfo(user) : null;
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async signUp(email, password, name) {
    const users = read<Record<string, StoredUser>>(USERS, {});
    const key = email.trim().toLowerCase();
    if (users[key]) throw new AuthError('exists');
    const user: StoredUser = { id: crypto.randomUUID(), email: key, name: name.trim(), hash: await hash(password) };
    users[key] = user;
    write(USERS, users);
    write(SESSION, user.id);
    emit(toInfo(user));
    return toInfo(user);
  },
  async signIn(email, password) {
    const user = read<Record<string, StoredUser>>(USERS, {})[email.trim().toLowerCase()];
    if (!user || user.hash !== (await hash(password))) throw new AuthError('invalid');
    write(SESSION, user.id);
    emit(toInfo(user));
    return toInfo(user);
  },
  async signOut() {
    write(SESSION, null);
    emit(null);
  },
  async resetPassword() {
    // Nothing to send in local mode.
  },
  async loadProfile(id) { return data(id).profile; },
  async saveProfile(id, profile) { write(dataKey(id), { ...data(id), profile }); },
  async loadSprint(id) { return data(id).sprint; },
  async saveSprint(id, sprint) { write(dataKey(id), { ...data(id), sprint }); },
  async loadCheckins(id) { return data(id).checkins; },
  async setCheckin(id, c, done) {
    const d = data(id);
    const rest = d.checkins.filter((x) => !(x.day === c.day && x.item_id === c.item_id));
    write(dataKey(id), { ...d, checkins: done ? [...rest, c] : rest });
  },
  async loadReminders(id) { return data(id).reminders ?? null; },
  async saveReminders(id, reminders) { write(dataKey(id), { ...data(id), reminders }); },
  // Push needs the server (Supabase). Local test mode cannot send pushes.
  async savePushSubscription() {},
  async deletePushSubscription() {},
};

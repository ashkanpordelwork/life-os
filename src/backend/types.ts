import type { Area, HealthAnswers, NeedTag, Sprint, VersionKey } from '../data/types';
import type { AnswerIndex } from '../engine';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  name: string;
  symptoms: NeedTag[];
  /** Latest answers to the 4 questions (asked again at each Release). */
  answers: Partial<Record<Area, AnswerIndex>>;
  /** Answers from onboarding, kept to show "Up X since you started". */
  start_answers?: Partial<Record<Area, AnswerIndex>>;
  /** "HH:MM", 24-hour. */
  wake_time?: string;
  bed_time?: string;
  health?: HealthAnswers;
  /** Read-only for the app: set on the server (payment, or the founding-member migration). */
  plan?: 'free' | 'pro';
  founder?: boolean;
  pro_since?: string;
  /** Admin dashboard access. Set in the database only. */
  is_admin?: boolean;
}

export interface Checkin {
  /** Local date YYYY-MM-DD */
  day: string;
  item_id: string;
  version: VersionKey;
}

export interface ReminderPrefs {
  push_enabled: boolean;
  inapp_enabled: boolean;
  /** Local time HH:MM */
  remind_at: string;
  /** IANA time zone, e.g. Europe/London */
  tz: string;
  /** Push at each patch's own time (needs push_enabled). */
  patch_push?: boolean;
  /** Push when someone in a Tribe sends a high five (needs push_enabled). */
  tribe_push?: boolean;
  /** Worked out by the app; the server sends at these times. */
  patch_times?: PatchTime[];
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Tribe { id: string; name: string; code: string; created_by: string }

/** What a member shows their Tribes (one row per user). */
export interface TribeStatus {
  user_id: string;
  display_name: string;
  day: string | null;
  done: number;
  total: number;
  streak: number;
  patch_titles: string[] | null;
  sprint_number: number | null;
  sprint_theme: string | null;
  score: number | null;
  share_patches: boolean;
  share_score: boolean;
  updated_at?: string;
}

export type TribeEventKind = 'active' | 'all_done' | 'release' | 'joined';
export interface TribeEvent {
  id: number;
  user_id: string;
  kind: TribeEventKind;
  day: string;
  payload: Record<string, unknown>;
  created_at: string;
}
export interface HighFive { event_id: number; from_user: string }

export interface TribeDetail {
  tribe: Tribe;
  members: string[];
  statuses: TribeStatus[];
  events: TribeEvent[];
  highFives: HighFive[];
}

/** Error codes shown to the user via src/i18n/en.json -> auth.errors */
export type AuthErrorCode = 'invalid' | 'exists' | 'weak' | 'email' | 'confirm' | 'network' | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

/**
 * Where data lives. Two versions with the same shape:
 * - local: this browser only (used when Supabase keys are missing, e.g. for development)
 * - supabase: real accounts and a database
 */
export interface Backend {
  mode: 'local' | 'supabase';
  getUser(): Promise<UserInfo | null>;
  onAuthChange(cb: (user: UserInfo | null) => void): () => void;
  /** Returns null when the account needs email confirmation first. */
  signUp(email: string, password: string, name: string): Promise<UserInfo | null>;
  signIn(email: string, password: string): Promise<UserInfo>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  loadProfile(userId: string): Promise<Profile | null>;
  saveProfile(userId: string, profile: Profile): Promise<void>;
  loadSprint(userId: string): Promise<Sprint | null>;
  saveSprint(userId: string, sprint: Sprint): Promise<void>;
  loadCheckins(userId: string): Promise<Checkin[]>;
  setCheckin(userId: string, checkin: Checkin, done: boolean): Promise<void>;
  loadReminders(userId: string): Promise<ReminderPrefs | null>;
  saveReminders(userId: string, prefs: ReminderPrefs): Promise<void>;
  savePushSubscription(userId: string, sub: PushSub): Promise<void>;
  /** Tribes need the live app (Supabase). The local backend has `tribes: null`. */
  tribes: TribeApi | null;
  /** Admin dashboard (live app only). */
  admin: AdminApi | null;
  /** The latest in-app message from the admin, if any. */
  latestMessage(): Promise<Announcement | null>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
}

export interface TribeApi {
  myTribes(userId: string): Promise<Tribe[]>;
  detail(tribeId: string, sinceDay: string): Promise<TribeDetail>;
  create(name: string): Promise<Tribe>;
  /** null when the code is wrong. */
  join(code: string): Promise<Tribe | null>;
  leave(userId: string, tribeId: string): Promise<void>;
  myStatus(userId: string): Promise<TribeStatus | null>;
  publishStatus(status: TribeStatus): Promise<void>;
  logEvent(userId: string, kind: TribeEventKind, day: string, payload?: Record<string, unknown>): Promise<void>;
  highFive(userId: string, eventId: number, on: boolean): Promise<void>;
}

/** One patch reminder for today: local time "HH:MM". `cutoff` = the time is a deadline (caffeine, alcohol). */
export interface PatchTime { id: string; title: string; at: string; cutoff: boolean }

export interface Announcement { id: number; title: string; body: string; created_at: string }

export interface AdminStats {
  users: number; new_7d: number; active_today: number; active_7d: number;
  plans: Record<string, number>; tribes: number; tribe_members: number;
  retention7: number | null;
  top_patches: { id: string; n: number }[];
}
export interface AdminUser { id: string; email: string; name: string; plan: string; founder: boolean; created_at: string; last_active: string | null; active_days: number }
export interface AdminTribe { id: string; name: string; code: string; members: number; created_at: string }

export interface AdminApi {
  stats(): Promise<AdminStats>;
  users(search: string): Promise<AdminUser[]>;
  setPlan(email: string, plan: 'free' | 'pro'): Promise<'ok' | 'not_found'>;
  tribes(): Promise<AdminTribe[]>;
  deleteTribe(id: string): Promise<void>;
  removeMember(tribeId: string, userId: string): Promise<void>;
  publish(title: string, body: string): Promise<void>;
}

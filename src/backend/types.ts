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
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
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
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
}

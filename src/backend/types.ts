import type { Area, NeedTag, Sprint, VersionKey } from '../data/types';
import type { AnswerIndex } from '../engine';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  name: string;
  symptoms: NeedTag[];
  answers: Partial<Record<Area, AnswerIndex>>;
}

export interface Checkin {
  /** Local date YYYY-MM-DD */
  day: string;
  item_id: string;
  version: VersionKey;
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
}

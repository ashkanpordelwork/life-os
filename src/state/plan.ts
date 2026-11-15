import type { Profile } from '../backend/types';

/**
 * Plans (owner decisions):
 * - Free: the first week only. After it, the same habits can go on, but no new week.
 * - Pro: each finished week opens the next one. Also Level 2–3 habits and the Pro tools.
 * - New sign-ups start on Free. They ask for Pro on the Pro page; an admin approves it.
 * - Everyone who had an account when requests started was made Pro (migrations-pro-requests.sql).
 * - No more "founding member" in the app (the founder column stays in the database and counts as Pro).
 */
export const FREE_SPRINTS = 1;

export type PlanState = 'pro' | 'free';

export function planState(profile: Profile | null | undefined): PlanState {
  return profile?.founder || profile?.plan === 'pro' ? 'pro' : 'free';
}

export const hasPro = (s: PlanState) => s !== 'free';

/** Can this user start Sprint number `n`? */
export function canStartSprint(s: PlanState, n: number): boolean {
  return hasPro(s) || n <= FREE_SPRINTS;
}

import type { Profile } from '../backend/types';

/**
 * Plans (owner decisions):
 * - Free: the first Sprint only. After it, the same patches can go on, but no new Sprint.
 * - Pro: each finished Sprint opens the next one. Also Level 2–3 patches and the Pro tools.
 * - Everyone who had an account before plans existed is Pro for good ("Founding member").
 * - No payment yet, so the lock is OFF: new users get Pro during the beta.
 *   Turn PRO_LOCK_ENABLED on once paying for Pro is possible.
 */
export const PRO_LOCK_ENABLED = false;
export const FREE_SPRINTS = 1;

export type PlanState = 'founder' | 'pro' | 'beta' | 'free';

export function planState(profile: Profile | null | undefined): PlanState {
  if (profile?.founder) return 'founder';
  if (profile?.plan === 'pro') return 'pro';
  return PRO_LOCK_ENABLED ? 'free' : 'beta';
}

export const hasPro = (s: PlanState) => s !== 'free';

/** Can this user start Sprint number `n`? */
export function canStartSprint(s: PlanState, n: number): boolean {
  return hasPro(s) || n <= FREE_SPRINTS;
}

import type { HabitGoal } from '../data/types';

/** The user's goal for a habit: their own number if set (and valid), else the book's default. */
export function goalValue(goal: HabitGoal, mine?: number): number {
  return typeof mine === 'number' && mine > 0 ? clampGoal(goal, mine) : goal.default;
}

/** Keep a goal inside the habit's range and on its step. */
export function clampGoal(goal: HabitGoal, n: number): number {
  const stepped = Math.round(n / goal.step) * goal.step;
  return Math.min(goal.max, Math.max(goal.min, stepped));
}

/** Share of the goal done, 0–1. No amount logged means a plain tick: counts as full. */
export function goalProgress(amount: number | undefined, target: number): number {
  if (amount === undefined) return 1;
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, amount / target));
}

/** Next value when logging today's amount, kept at 0 or above and on the log step. */
export function stepAmount(goal: HabitGoal, n: number, dir: 1 | -1): number {
  const next = (Math.round(n / goal.log_step) + dir) * goal.log_step;
  return Math.max(0, next);
}

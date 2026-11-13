import type { ChecklistItem, Level, Sprint } from '../data/types';
import { activeDays, addDays, dayKey, daysBetween, restDays, type DayCheckin } from './streak';

/** Owner rule: L2 opens from Sprint 3 only if at least 70% of the last Sprint's days had 1+ patch done. */
export const LEVEL_UP_COMPLETION = 0.7;

/**
 * Share of a Sprint's days with at least 1 patch done (0–1).
 * Counts only days that have started (up to `today`). Rest days are left out of the count,
 * because they are allowed ("Nothing owed").
 */
export function sprintCompletion(sprint: Sprint, checkins: DayCheckin[], today: string): number {
  const start = dayKey(new Date(sprint.started_at));
  const elapsed = Math.min(sprint.length_days, daysBetween(start, today) + 1);
  if (elapsed <= 0) return 0;
  const end = addDays(start, elapsed - 1);
  const inRange = (d: string) => d >= start && d <= end;
  const active = [...activeDays(checkins)].filter(inRange).length;
  const rest = [...restDays(checkins)].filter((d) => inRange(d) && !activeDays(checkins).has(d)).length;
  const days = elapsed - rest;
  return days <= 0 ? 0 : active / days;
}

export interface LevelContext {
  /** Completion of the Sprint before this one (0–1). Undefined = unknown (treated as not earned). */
  prevCompletion?: number;
  /** L2 was already open earlier (e.g. the last Sprint had an L2 patch). Once open, it stays open. */
  l2Open?: boolean;
}

/**
 * Levels unlocked for a Sprint (docs/engine-spec.md 3-A + owner rule):
 * Sprint 1–2: L1. Sprint 3+: L2 too, if earned (70%) or already open. Sprint 5+: L3 too, when L2 is open.
 */
export function allowedLevels(sprintNumber: number, ctx: LevelContext = {}): Level[] {
  if (sprintNumber <= 2) return [1];
  const l2 = !!ctx.l2Open || (ctx.prevCompletion ?? 0) >= LEVEL_UP_COMPLETION;
  if (!l2) return [1];
  return sprintNumber <= 4 ? [1, 2] : [1, 2, 3];
}

/** Step 2. Keep only items whose level is unlocked for this Sprint. */
export function levelFilter(items: ChecklistItem[], sprintNumber: number, ctx?: LevelContext): ChecklistItem[] {
  const levels = allowedLevels(sprintNumber, ctx);
  return items.filter((i) => levels.includes(i.level));
}

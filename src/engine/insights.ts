import type { Sprint } from '../data/types';
import { activeDays, addDays, dayKey, daysBetween, restDays, weekDays, type DayCheckin } from './streak';

/** Longest run of counted days ever. Rest days keep a run going but do not add to it. */
export function longestStreak(checkins: DayCheckin[]): number {
  const active = activeDays(checkins);
  const rest = restDays(checkins);
  const days = [...new Set([...active, ...rest])].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (prev === null || daysBetween(prev, d) !== 1) run = 0;
    if (active.has(d)) run++;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Counted days per weekday (Monday first) over the last `weeks` weeks, this week included. */
export function weekdayCounts(checkins: DayCheckin[], today: string, weeks = 8): number[] {
  const active = activeDays(checkins);
  const first = addDays(weekDays(today)[0], -7 * (weeks - 1));
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(first, i);
    if (d > today) break;
    if (active.has(d)) counts[i % 7]++;
  }
  return counts;
}

export interface PatchRate {
  id: string;
  /** Days this patch was done in the Sprint so far. */
  done: number;
  /** Days of the Sprint that have started. */
  days: number;
  /** What "all done" would be so far: every day, or weeks × weekly target for weekly patches. */
  target: number;
}

/** How often each Sprint patch was done so far. */
export function patchRates(sprint: Sprint, checkins: DayCheckin[], today: string, perWeek: (id: string) => number | undefined = () => undefined): PatchRate[] {
  const start = dayKey(new Date(sprint.started_at));
  const days = Math.max(1, Math.min(sprint.length_days, daysBetween(start, today) + 1));
  const end = addDays(start, days - 1);
  return sprint.patch_ids.map((id) => {
    const pw = perWeek(id);
    return {
      id,
      done: new Set(checkins.filter((c) => c.item_id === id && c.day >= start && c.day <= end).map((c) => c.day)).size,
      days,
      target: pw ? Math.min(days, Math.ceil(days / 7) * pw) : days,
    };
  });
}

/** Index of the single highest value. -1 when all are 0 or the top is shared (no clear winner). */
export function bestIndex(values: number[]): number {
  const top = Math.max(0, ...values);
  if (top === 0) return -1;
  const at = values.flatMap((v, i) => (v === top ? [i] : []));
  return at.length === 1 ? at[0] : -1;
}

export interface WeekPercent {
  /** Habit-days done this week (weekly habits count up to their target). */
  done: number;
  /** Habit-days expected so far this week. */
  target: number;
  /** 0–100, rounded. */
  percent: number;
}

/**
 * "This week" on Today (user feedback: the old score never moved and nobody knew what it meant).
 * Daily habits: one per day that has started. Weekly habits (e.g. 3× a week): their weekly target.
 * Rest days don't count against you.
 */
export function weekPercent(sprint: Sprint, checkins: DayCheckin[], today: string, perWeek: (id: string) => number | undefined): WeekPercent {
  const start = dayKey(new Date(sprint.started_at));
  const elapsed = Math.max(1, Math.min(sprint.length_days, daysBetween(start, today) + 1));
  const end = addDays(start, elapsed - 1);
  const rest = [...restDays(checkins)].filter((d) => d >= start && d <= end && !activeDays(checkins).has(d)).length;
  const days = Math.max(0, elapsed - rest);
  let done = 0;
  let target = 0;
  for (const id of sprint.patch_ids) {
    const n = new Set(checkins.filter((c) => c.item_id === id && c.day >= start && c.day <= end).map((c) => c.day)).size;
    const pw = perWeek(id);
    if (pw) { target += pw; done += Math.min(n, pw); }
    else { target += days; done += Math.min(n, days); }
  }
  return { done, target, percent: target ? Math.round((done / target) * 100) : 0 };
}

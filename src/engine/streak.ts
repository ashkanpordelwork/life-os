/**
 * Days, streak and progress. Pure functions (no clock inside: "today" is passed in).
 * Owner rule: a day counts for the streak when at least 1 patch is done.
 */

export interface DayCheckin {
  /** Local date, YYYY-MM-DD */
  day: string;
  item_id: string;
}

export const MIN_PATCHES_FOR_STREAK = 1;

/** Local calendar date as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

/** Number of patches done per day. */
export function doneByDay(checkins: DayCheckin[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of checkins) map.set(c.day, (map.get(c.day) ?? 0) + 1);
  return map;
}

/** Days that count (at least MIN_PATCHES_FOR_STREAK done). */
export function activeDays(checkins: DayCheckin[]): Set<string> {
  const set = new Set<string>();
  for (const [day, n] of doneByDay(checkins)) if (n >= MIN_PATCHES_FOR_STREAK) set.add(day);
  return set;
}

/**
 * Current streak. If today already counts, start from today.
 * If not, start from yesterday (today is still open, the streak is not broken yet).
 */
export function currentStreak(checkins: DayCheckin[], today: string): number {
  const active = activeDays(checkins);
  let day = active.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (active.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Total days that counted, ever. */
export function totalActiveDays(checkins: DayCheckin[]): number {
  return activeDays(checkins).size;
}

/** Day number inside the Sprint (1 to length). */
export function sprintDay(startDay: string, today: string, length = 14): number {
  return Math.min(length, Math.max(1, daysBetween(startDay, today) + 1));
}

/** HeatCell level 0–4 from patches done (4 = all done). */
export function heatLevel(done: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (done <= 0 || total <= 0) return 0;
  return Math.min(4, Math.max(1, Math.round((done / total) * 4))) as 1 | 2 | 3 | 4;
}

/** Monday to Sunday of the week that contains `today`. */
export function weekDays(today: string): string[] {
  const d = parseDay(today);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

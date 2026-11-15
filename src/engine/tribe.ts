import { addDays } from './streak';

/**
 * Owner rule (cooperative Tribes): a day counts for the Tribe when at least half of the members
 * did at least 1 patch. The Tribe streak is the run of such days up to today
 * (today still open: if it doesn't count yet, start from yesterday).
 */
export function tribeDayCounts(activeByDay: Map<string, Set<string>>, members: number, day: string): boolean {
  if (members <= 0) return false;
  return (activeByDay.get(day)?.size ?? 0) >= Math.ceil(members / 2);
}

export function tribeStreak(active: { user_id: string; day: string }[], members: number, today: string): number {
  const byDay = new Map<string, Set<string>>();
  for (const a of active) {
    if (!byDay.has(a.day)) byDay.set(a.day, new Set());
    byDay.get(a.day)!.add(a.user_id);
  }
  let day = tribeDayCounts(byDay, members, today) ? today : addDays(today, -1);
  let n = 0;
  while (tribeDayCounts(byDay, members, day)) { n++; day = addDays(day, -1); }
  return n;
}

/** "3 h ago", "2 d ago" style label. */
export function timeAgo(iso: string, now = Date.now()): { n: number; unit: 'now' | 'm' | 'h' | 'd' } {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return { n: 0, unit: 'now' };
  if (s < 3600) return { n: Math.floor(s / 60), unit: 'm' };
  if (s < 86400) return { n: Math.floor(s / 3600), unit: 'h' };
  return { n: Math.floor(s / 86400), unit: 'd' };
}

/** Weekly Tribe challenge (app choice): active days together, 4 per member, Monday to Sunday. */
export const CHALLENGE_DAYS_PER_MEMBER = 4;

export interface TribeChallenge { done: number; goal: number; lastDone: number; lastGoal: number; reached: boolean }

/** Active member-days this week and last week (each member counts once per day). */
export function tribeChallenge(active: { user_id: string; day: string }[], members: number, today: string): TribeChallenge {
  const monday = weekStart(today);
  const lastMonday = addDays(monday, -7);
  const count = (from: string, to: string) => new Set(active.filter((a) => a.day >= from && a.day <= to).map((a) => `${a.user_id}|${a.day}`)).size;
  const goal = Math.max(1, members * CHALLENGE_DAYS_PER_MEMBER);
  const done = count(monday, addDays(monday, 6));
  return { done, goal, lastDone: count(lastMonday, addDays(monday, -1)), lastGoal: goal, reached: done >= goal };
}

export function weekStart(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}

/** One member's week on the board. */
export interface BoardRow { user_id: string; activeDays: number; finishedDays: number; crown: boolean }
export type TitleKind = 'earlyBird' | 'finisher' | 'comeback';
export interface BoardTitle { kind: TitleKind; user_id: string }
export interface WeekBoard { rows: BoardRow[]; titles: BoardTitle[] }

interface BoardEvent { user_id: string; kind: string; day: string; created_at: string }

/** Smallest numbers before a title is given, so a quiet week doesn't crown anyone (app choices). */
const MIN_FOR_TITLE = 2;

/**
 * The Tribe's week (Monday to today), ranked by active days, then finished days.
 * The crown goes to everyone tied at the top, once they have at least 1 active day.
 * Titles (app choices):
 * - earlyBird: finished the day first on the most days (at least 2)
 * - finisher: most days with every habit done (at least 2)
 * - comeback: biggest rise in active days since last week (at least +2, and at least 2 this week)
 * A tie gives no title: only a clear winner gets one.
 */
export function weekBoard(events: BoardEvent[], members: string[], today: string): WeekBoard {
  const monday = weekStart(today);
  const lastMonday = addDays(monday, -7);
  const inWeek = (e: BoardEvent) => e.day >= monday && e.day <= today;
  const days = (kind: string, from: string, to: string) => {
    const m = new Map<string, Set<string>>();
    for (const e of events) if (e.kind === kind && e.day >= from && e.day <= to) {
      if (!m.has(e.user_id)) m.set(e.user_id, new Set());
      m.get(e.user_id)!.add(e.day);
    }
    return m;
  };
  const active = days('active', monday, today);
  const finished = days('all_done', monday, today);
  const lastActive = days('active', lastMonday, addDays(monday, -1));

  const rows: BoardRow[] = members.map((user_id) => ({
    user_id, activeDays: active.get(user_id)?.size ?? 0, finishedDays: finished.get(user_id)?.size ?? 0, crown: false,
  })).sort((a, b) => b.activeDays - a.activeDays || b.finishedDays - a.finishedDays);
  const top = rows[0];
  if (top && top.activeDays >= 1) for (const r of rows) r.crown = r.activeDays === top.activeDays && r.finishedDays === top.finishedDays;

  const clearWinner = (score: Map<string, number>, min: number): string | null => {
    const sorted = [...score.entries()].filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    return sorted.length > 1 && sorted[1][1] === sorted[0][1] ? null : sorted[0][0];
  };

  const titles: BoardTitle[] = [];
  // Early bird: the earliest all_done of each day scores a point.
  const firstByDay = new Map<string, BoardEvent>();
  for (const e of events.filter((x) => x.kind === 'all_done' && inWeek(x))) {
    const cur = firstByDay.get(e.day);
    if (!cur || e.created_at < cur.created_at) firstByDay.set(e.day, e);
  }
  const birdScore = new Map<string, number>();
  for (const e of firstByDay.values()) birdScore.set(e.user_id, (birdScore.get(e.user_id) ?? 0) + 1);
  const bird = clearWinner(birdScore, MIN_FOR_TITLE);
  if (bird) titles.push({ kind: 'earlyBird', user_id: bird });

  const fin = clearWinner(new Map(rows.map((r) => [r.user_id, r.finishedDays])), MIN_FOR_TITLE);
  if (fin) titles.push({ kind: 'finisher', user_id: fin });

  const rise = new Map(rows.map((r) => [r.user_id, r.activeDays >= MIN_FOR_TITLE ? r.activeDays - (lastActive.get(r.user_id)?.size ?? 0) : 0]));
  const back = clearWinner(rise, 2);
  if (back) titles.push({ kind: 'comeback', user_id: back });

  return { rows, titles };
}

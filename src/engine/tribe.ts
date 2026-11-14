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

import { addDays } from './streak';

/** Life modes (owner decision). */
export type ModeKind = 'travel' | 'sick' | 'deadline' | 'vacation';
export const MODE_KINDS: ModeKind[] = ['deadline', 'travel', 'sick', 'vacation'];
export interface LifeMode { id: string; mode: ModeKind; start_day: string; end_day: string }

/** Modes that pause the streak and push reminders (app rule: you're not expected to do patches). */
export const PAUSING: ModeKind[] = ['sick', 'vacation'];

/** The mode running today, if any (the latest one wins). */
export function activeMode(modes: LifeMode[], today: string): LifeMode | null {
  return [...modes].filter((m) => m.start_day <= today && m.end_day >= today).sort((a, b) => (a.start_day < b.start_day ? 1 : -1))[0] ?? null;
}

/** Every day so far covered by a pausing mode. These count like rest days: the streak doesn't break. */
export function pausedDays(modes: LifeMode[], today: string): Set<string> {
  const out = new Set<string>();
  for (const m of modes) {
    if (!PAUSING.includes(m.mode)) continue;
    const last = m.end_day < today ? m.end_day : today;
    for (let d = m.start_day; d <= last; d = addDays(d, 1)) out.add(d);
  }
  return out;
}

import type { ChecklistItem, Slot } from '../data/types';

/** "HH:MM" → minutes after midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes after midnight → "HH:MM" (wraps around midnight). */
export function fromMinutes(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export interface TimeHint {
  /** Start of the window, minutes after midnight. Used to sort Today. */
  at: number;
  /** "07:00" or "13:00–17:00" */
  label: string;
  /** True when the time is a deadline ("until 12:30"). */
  cutoff: boolean;
}

/**
 * Personal time for an item from its trigger and the user's wake and bed times.
 * Items tied to meals or sitting have no fixed clock time: returns null.
 */
export function timeHint(item: ChecklistItem, wake: string, bed: string): TimeHint | null {
  const t = item.trigger;
  if (!t || (t.anchor !== 'wake' && t.anchor !== 'bed')) return null;
  let base = toMinutes(t.anchor === 'wake' ? wake : bed);
  // Bed after midnight (e.g. 00:30) still belongs to the same day as wake.
  if (t.anchor === 'bed' && base < toMinutes(wake)) base += 1440;
  const a = base + t.offset_min;
  const label = t.offset_max !== undefined && t.offset_max !== t.offset_min
    ? `${fromMinutes(a)}–${fromMinutes(base + t.offset_max)}`
    : fromMinutes(a);
  return { at: a, label, cutoff: !!t.cutoff };
}

/** Rough place in the day for items without a clock time, so Today can sort everything. */
const SLOT_ORDER: Record<Slot, number> = { MORNING: 0, DESK: 1, LUNCH: 2, EVENING: 3, BEDTIME: 4 };

/** Sort key in minutes after midnight (wake-relative for slots). */
export function dayOrder(item: ChecklistItem, wake: string, bed: string): number {
  const hint = timeHint(item, wake, bed);
  if (hint) return hint.at;
  const w = toMinutes(wake);
  let b = toMinutes(bed);
  if (b < w) b += 1440;
  const step = (b - w) / 5;
  return w + step * SLOT_ORDER[item.slot] + step / 2;
}

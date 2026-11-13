import type { ChecklistItem, Level } from '../data/types';

/**
 * Levels unlocked for a Sprint (docs/engine-spec.md 3-A):
 * Sprint 1–2: L1. Sprint 3–4: L1 + L2. Sprint 5+: L1–L3.
 * TODO(owner): the 70% completion rule for unlocking L2 is not applied yet (no tracking in this phase).
 */
export function allowedLevels(sprintNumber: number): Level[] {
  if (sprintNumber <= 2) return [1];
  if (sprintNumber <= 4) return [1, 2];
  return [1, 2, 3];
}

/** Step 2. Keep only items whose level is unlocked for this Sprint. */
export function levelFilter(items: ChecklistItem[], sprintNumber: number): ChecklistItem[] {
  const levels = allowedLevels(sprintNumber);
  return items.filter((i) => levels.includes(i.level));
}

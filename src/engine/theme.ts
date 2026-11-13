import type { Area, ChecklistItem, SprintTheme } from '../data/types';

const AREA_THEME: Record<Area, SprintTheme> = {
  Movement: 'Move more',
  Nutrition: 'Eat on time',
  Sleep: 'Sleep base',
  Mind: 'Calm focus',
};

/**
 * Owner rule: the Sprint theme is picked from its patches.
 * 2+ morning patches → "Morning basics". Otherwise the area most patches belong to.
 * A tie goes to the area of the first patch in the list.
 */
export function themeFor(items: ChecklistItem[]): SprintTheme | null {
  if (!items.length) return null;
  if (items.filter((i) => i.slot === 'MORNING').length >= 2) return 'Morning basics';
  const count = new Map<Area, number>();
  for (const i of items) count.set(i.area, (count.get(i.area) ?? 0) + 1);
  let best = items[0].area;
  for (const i of items) if ((count.get(i.area) ?? 0) > (count.get(best) ?? 0)) best = i.area;
  return AREA_THEME[best];
}

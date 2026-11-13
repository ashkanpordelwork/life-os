import { AREAS, type ChecklistItem } from '../data/types';
import type { AreaScores } from './areaScore';
import { gap } from './areaScore';

export interface ScoredItem {
  item: ChecklistItem;
  score: number;
}

/** About 12 minutes a day (Figma: "About 12 minutes a day"). */
export const DAILY_MINUTES_CAP = 12;

const EPS = 1e-9;

/** Highest score first; ties broken by id so the result is always the same. */
export function byScore(a: ScoredItem, b: ScoredItem): number {
  if (Math.abs(a.score - b.score) > EPS) return b.score - a.score;
  return a.item.id.localeCompare(b.item.id);
}

/** Minutes an item adds to the daily cap. Items spread over the day (like steps) add none. */
export function capMinutes(item: ChecklistItem): number {
  return item.spread_over_day ? 0 : item.duration_min;
}

function totalMinutes(list: ScoredItem[]): number {
  return list.reduce((s, x) => s + capMinutes(x.item), 0);
}

/**
 * Step 4. Build 4 offers.
 * - Best item from each area (Movement, Nutrition, Sleep, Mind).
 * - If an area has no allowed item, take the next best item from the area with the biggest gap.
 * - Keep the total at about 12 min or less: swap the lowest-scoring offer for a shorter one.
 * Returns the offers sorted by score (highest first).
 */
export function compose4(scored: ScoredItem[], scores: AreaScores, count = 4): ScoredItem[] {
  const sorted = [...scored].sort(byScore);
  const picked: ScoredItem[] = [];
  const used = new Set<string>();
  const take = (x: ScoredItem) => { picked.push(x); used.add(x.item.id); };

  for (const area of AREAS) {
    const best = sorted.find((x) => x.item.area === area && !used.has(x.item.id));
    if (best) take(best);
  }

  // Fill empty slots from the areas with the biggest gap first.
  const areasByGap = [...AREAS].sort((a, b) => gap(scores, b) - gap(scores, a));
  while (picked.length < count) {
    let next: ScoredItem | undefined;
    for (const area of areasByGap) {
      next = sorted.find((x) => x.item.area === area && !used.has(x.item.id));
      if (next) break;
    }
    if (!next) break;
    take(next);
  }

  // Time cap: replace the weakest offer with the best remaining shorter item.
  let guard = sorted.length;
  while (totalMinutes(picked) > DAILY_MINUTES_CAP + EPS && guard-- > 0) {
    const weakest = [...picked].sort(byScore).pop()!;
    const replacement =
      sorted.find((x) => !used.has(x.item.id) && x.item.area === weakest.item.area && capMinutes(x.item) < capMinutes(weakest.item)) ??
      sorted.find((x) => !used.has(x.item.id) && capMinutes(x.item) < capMinutes(weakest.item));
    if (!replacement) break;
    picked.splice(picked.indexOf(weakest), 1, replacement);
    used.add(replacement.item.id);
  }

  return picked.sort(byScore);
}

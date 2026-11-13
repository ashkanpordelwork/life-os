import type { ChecklistItem, NeedTag } from '../data/types';
import { gap, type AreaScores } from './areaScore';

/** Evidence weight. Fixed at 0.5 until the PubMed review is done. */
export const DEFAULT_EVIDENCE = 0.5;

export interface ScoreParts {
  M: number;
  gap: number;
  Q: 0 | 1;
  E: number;
  score: number;
}

/**
 * Step 3. score = 3 × (M ÷ 3) + 2 × (gap ÷ 5) + 1 × Q + 1 × E
 * M   = item tags that match the user's symptoms (max 3)
 * gap = 5 − the item's area score
 * Q   = 1 if the item takes 5 min or less, else 0
 * E   = evidence weight (0.5 for now)
 */
export function scoreItem(item: ChecklistItem, symptoms: NeedTag[], scores: AreaScores): ScoreParts {
  const M = Math.min(3, item.needs.filter((n) => symptoms.includes(n)).length);
  const g = gap(scores, item.area);
  const Q: 0 | 1 = item.duration_min <= 5 ? 1 : 0;
  const E = DEFAULT_EVIDENCE;
  const score = 3 * (M / 3) + 2 * (g / 5) + 1 * Q + 1 * E;
  return { M, gap: g, Q, E, score };
}

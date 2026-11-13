import type { ChecklistItem, NeedTag } from '../data/types';
import type { SafetyContext } from '../data/safetyRules';
import type { AreaScores } from './areaScore';
import { safetyFilter } from './safetyFilter';
import { levelFilter, type LevelContext } from './levelFilter';
import { scoreItem } from './scoreItem';
import { compose4, type ScoredItem } from './compose4';

export interface RecommendInput {
  items: ChecklistItem[];
  symptoms: NeedTag[];
  scores: AreaScores;
  sprintNumber: number;
  flags?: SafetyContext['flags'];
  /** Level 2 unlock info (70% rule). */
  levels?: LevelContext;
}

/**
 * Full pipeline: only Sprint patches -> safety filter -> level filter -> score -> 4 offers.
 * The user then picks 3.
 */
export function recommend({ items, symptoms, scores, sprintNumber, flags, levels }: RecommendInput): ScoredItem[] {
  const patches = items.filter((i) => i.kind === 'patch');
  const safe = safetyFilter(patches, { symptoms, flags });
  const unlocked = levelFilter(safe, sprintNumber, levels);
  const scored = unlocked.map((item) => ({ item, score: scoreItem(item, symptoms, scores).score }));
  return compose4(scored, scores);
}

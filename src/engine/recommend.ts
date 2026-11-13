import type { ChecklistItem, NeedTag } from '../data/types';
import type { SafetyContext } from '../data/safetyRules';
import type { AreaScores } from './areaScore';
import { safetyFilter } from './safetyFilter';
import { levelFilter, type LevelContext } from './levelFilter';
import { scoreItem } from './scoreItem';
import { byScore, compose4, type ScoredItem } from './compose4';

export interface RecommendInput {
  items: ChecklistItem[];
  symptoms: NeedTag[];
  scores: AreaScores;
  sprintNumber: number;
  flags?: SafetyContext['flags'];
  /** Level 2 unlock info (70% rule). */
  levels?: LevelContext;
  /** How many offers. The first 4 come from compose4; more are the next best by score (owner decision). */
  count?: number;
}

/**
 * Full pipeline: only Sprint patches -> safety filter -> level filter -> score -> 4 offers.
 * The user then picks 3.
 */
export function recommend({ items, symptoms, scores, sprintNumber, flags, levels, count = 4 }: RecommendInput): ScoredItem[] {
  const patches = items.filter((i) => i.kind === 'patch');
  const safe = safetyFilter(patches, { symptoms, flags });
  const unlocked = levelFilter(safe, sprintNumber, levels);
  const scored = unlocked.map((item) => ({ item, score: scoreItem(item, symptoms, scores).score }));
  const base = compose4(scored, scores);
  if (count <= base.length) return base;
  const used = new Set(base.map((x) => x.item.id));
  const extra = [...scored].sort(byScore).filter((x) => !used.has(x.item.id)).slice(0, count - base.length);
  return [...base, ...extra];
}

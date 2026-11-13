import { getItem } from '../data';
import type { Area, ChecklistItem, Sprint, SprintTheme } from '../data/types';
import { themeFor, timeHint } from '../engine';
import { AREAS } from '../data/types';
import type { OnboardingState } from '../state/onboarding';

/** Onboarding steps shown in the TopBar counter and segments:
 *  Symptoms + 4 questions + sleep times (after the Sleep question) + score = 7. */
export const TOTAL_STEPS = 7;
export const TIMES_ROUTE = '/times';
export const TIMES_STEP = 5;

export const QUESTION_ROUTES: Record<Area, string> = {
  Movement: '/question/movement',
  Nutrition: '/question/nutrition',
  Sleep: '/question/sleep',
  Mind: '/question/mind',
};

export function areaFromSlug(slug: string | undefined): Area | undefined {
  return AREAS.find((a) => a.toLowerCase() === slug);
}

/** First question without an answer, or null when all 4 are answered. */
export function firstMissingQuestion(state: OnboardingState): string | null {
  const missing = AREAS.find((a) => state.answers[a] === undefined);
  return missing ? QUESTION_ROUTES[missing] : null;
}

/** Duration label for cards, e.g. "5 min", "30 s", "No extra time". */
export function formatMinutes(min: number, t: (k: string, v?: Record<string, number>) => string): string {
  if (min <= 0) return t('time.none');
  if (min < 1) return t('time.seconds', { n: Math.round(min * 60) });
  return t('time.minutes', { n: Math.round(min) });
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** When to do a patch: the personal clock time if it has one, else the part of the day. */
export function whenLabel(item: ChecklistItem, wake: string, bed: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  const hint = timeHint(item, wake, bed);
  if (!hint) return t(`slots.${item.slot}`);
  return hint.cutoff ? t('time.until', { time: hint.label }) : hint.label;
}

/** Today card meta, e.g. "08:00–08:30 · No extra time" or "After a meal · 5 min". */
export function patchMeta(item: ChecklistItem, wake: string, bed: string, tiny: boolean, t: (k: string, v?: Record<string, string | number>) => string): string {
  return `${whenLabel(item, wake, bed, t)} · ${tiny ? item.versions.tiny.time : formatMinutes(item.duration_min, t)}`;
}

/** The Sprint's theme; older Sprints without one get it from their patches. */
export function sprintTheme(sprint: Sprint): SprintTheme | null {
  return sprint.theme ?? themeFor(sprint.patch_ids.map(getItem).filter((x): x is ChecklistItem => !!x));
}

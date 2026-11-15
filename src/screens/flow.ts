import { getItem } from '../data';
import type { Area, ChecklistItem, Sprint, SprintTheme } from '../data/types';
import { themeFor, timeHint } from '../engine';
import { AREAS } from '../data/types';
import type { OnboardingState } from '../state/onboarding';

/** Onboarding steps shown in the TopBar counter and segments:
 *  Symptoms + 4 questions + sleep times (after Sleep) + health check (after Mind) + score = 8.
 *  The Safety screen (Figma 2032:3562) between health check and score has no counter, as in Figma. */
export const TOTAL_STEPS = 8;
export const HEALTH_ROUTE = '/health';
export const HEALTH_STEP = 7;
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

/** Card label in the habit's own unit: "5 min", "7,000 steps", "500 ml". Clock and done/not habits have none
 *  (their time or part of the day already says it). */
export function itemAmount(item: ChecklistItem, t: (k: string, v?: Record<string, number>) => string): string {
  const kind = item.measure ?? 'time';
  if (kind === 'count' || kind === 'amount') return item.amount ?? '';
  if (kind === 'clock' || kind === 'check') return '';
  return item.amount ?? formatMinutes(item.duration_min, t);
}

/** Duration label for cards, e.g. "5 min", "30 s", "No extra time". */
export function formatMinutes(min: number, t: (k: string, v?: Record<string, number>) => string): string {
  if (min <= 0) return t('time.none');
  if (min < 1) return t('time.seconds', { n: Math.round(min * 60) });
  return t('time.minutes', { n: Math.round(min) });
}

/** Week and day numbers are shown plain ("Week 3 · Day 2"); the name stays for older call sites. */
export const pad2 = (n: number) => String(n);

/** When to do a patch: the personal clock time if it has one, else the part of the day. */
export function whenLabel(item: ChecklistItem, wake: string, bed: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  const hint = timeHint(item, wake, bed);
  if (!hint) return t(`slots.${item.slot}`);
  return hint.cutoff ? t('time.until', { time: hint.label }) : hint.label;
}

/** Today card meta, e.g. "08:00–08:30 · No extra time" or "After a meal · 5 min". */
export function patchMeta(item: ChecklistItem, wake: string, bed: string, tiny: boolean, t: (k: string, v?: Record<string, string | number>) => string): string {
  const amount = tiny ? item.versions.tiny.time : itemAmount(item, t);
  return amount ? `${whenLabel(item, wake, bed, t)} · ${amount}` : whenLabel(item, wake, bed, t);
}

/** The Sprint's theme; older Sprints without one get it from their patches. */
export function sprintTheme(sprint: Sprint): SprintTheme | null {
  return sprint.theme ?? themeFor(sprint.patch_ids.map(getItem).filter((x): x is ChecklistItem => !!x));
}

/** Short card line when there's no clock: the amount, or the part of the day for clock and done/not habits. */
export function cardMeta(item: ChecklistItem, t: (k: string, v?: Record<string, number>) => string): string {
  return itemAmount(item, t) || t(`slots.${item.slot}`);
}

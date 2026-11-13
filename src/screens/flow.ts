import type { Area } from '../data/types';
import { AREAS } from '../data/types';
import type { OnboardingState } from '../state/onboarding';

/** Onboarding steps shown in the TopBar counter and segments: Symptoms + 4 questions + score = 6. */
export const TOTAL_STEPS = 6;

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

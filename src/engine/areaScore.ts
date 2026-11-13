import { AREAS, type Area } from '../data/types';

/** Answer index on the question screens: 0 = "0", 1 = "1–2", 2 = "3–4", 3 = "5+". */
export type AnswerIndex = 0 | 1 | 2 | 3;

/**
 * TODO(owner): confirm. The owner has not given the answer -> score table yet.
 * Simple default: spread the 4 answers evenly over 0–5 (index × 5/3, one decimal).
 */
export const ANSWER_SCORES: Record<AnswerIndex, number> = { 0: 0, 1: 1.7, 2: 3.3, 3: 5 };

export function answerToScore(answer: AnswerIndex): number {
  return ANSWER_SCORES[answer];
}

export type AreaScores = Record<Area, number>;

export function areaScoresFromAnswers(answers: Record<Area, AnswerIndex>): AreaScores {
  return Object.fromEntries(AREAS.map((a) => [a, answerToScore(answers[a])])) as AreaScores;
}

/** Overall starting score = average of the 4 areas, one decimal (Figma: 2.0, 3.0, 2.5, 2.1 -> 2.4). */
export function overallScore(scores: AreaScores): number {
  const sum = AREAS.reduce((s, a) => s + scores[a], 0);
  return Math.round((sum / AREAS.length) * 10) / 10;
}

/** gap = 5 − area score */
export function gap(scores: AreaScores, area: Area): number {
  return 5 - scores[area];
}

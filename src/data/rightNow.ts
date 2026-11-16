/**
 * "Right now" data (owner decision: the app's core is a button for the moment you're in).
 * Source of every row: docs/problem-solution-matrix.md (PubMed reviews, searched 2026-11-16).
 *
 * Each option has a `review` status. Doctors supervise the rows (owner decision), but the app never blocks a user
 * waiting for them; REQUIRE_DOCTOR_REVIEW in src/engine/rightNow.ts can lock unapproved rows if that ever changes.
 * Texts live in src/i18n/en.json under `now.*`.
 */

export type NowStateId =
  | 'neck_back' | 'eyes' | 'stress' | 'headache' | 'stiff' | 'focus'
  | 'low_mood' | 'cant_sleep' | 'low_energy'
  | 'craving' | 'stress_eating' | 'weight_on_mind';

export type NowGroup = 'body' | 'energy' | 'mind' | 'sleep' | 'food';

export type NowActionId =
  | 'shoulder_neck_reset' | 'walk_break' | 'screen_break' | 'slow_breathing' | 'physiological_sigh'
  | 'neck_shoulder_relax' | 'daylight_break' | 'drink_water' | 'mood_walk' | 'warm_shower' | 'mindful_pause';

/**
 * How well the problem-and-action pair is backed (our own label, see the matrix):
 * moderate = a review with at least moderate certainty for this very question
 * low = a review exists but its authors rate certainty low, or most trials have high risk of bias
 * indirect = evidence is about a related group or outcome
 * pending = not researched well enough: never offered
 */
export type Strength = 'moderate' | 'low' | 'indirect' | 'pending';
export type Review = 'draft' | 'approved';
export type DayPart = 'morning' | 'day' | 'evening' | 'night';

export interface NowAction {
  id: NowActionId;
  /** About how long it takes. */
  minutes: number;
  /** Needs daylight or a bright window. */
  needsDaylight?: boolean;
  /** Only at these times of day. */
  dayParts?: DayPart[];
  /** Hidden when the user reported pregnancy, a heart condition or illness (existing Health check flag). */
  blockedByHealthRisk?: boolean;
  /** The weekly habit this can grow into (src/data/items.json). */
  habitId?: string;
}

/** One action offered for one state. The order inside a state is the tie-break. */
export interface NowOption {
  action: NowActionId;
  strength: Strength;
  /** DOIs of the reviews that back it (the matrix has the details). */
  sources: string[];
  review: Review;
}

export interface NowState {
  id: NowStateId;
  group: NowGroup;
  /** Food, eating and weight. Same rules as the rest: never blocked, only a small note. */
  food?: boolean;
  /** Show a small "a professional can help too" hint next to the suggestion. */
  talkToPro?: boolean;
  options: NowOption[];
}

export const NOW_ACTIONS: NowAction[] = [
  { id: 'shoulder_neck_reset', minutes: 2, habitId: 'EX04' },
  { id: 'walk_break', minutes: 3, habitId: 'EX01d' },
  { id: 'screen_break', minutes: 1, habitId: 'FM05' },
  { id: 'slow_breathing', minutes: 3, habitId: 'ST04' },
  { id: 'physiological_sigh', minutes: 1, habitId: 'ST01a' },
  { id: 'neck_shoulder_relax', minutes: 3, habitId: 'EX04' },
  { id: 'daylight_break', minutes: 5, needsDaylight: true, habitId: 'SL02' },
  { id: 'drink_water', minutes: 1, habitId: 'NU02b' },
  { id: 'mood_walk', minutes: 10, habitId: 'EX01a' },
  { id: 'warm_shower', minutes: 10, dayParts: ['evening', 'night'], blockedByHealthRisk: true },
  { id: 'mindful_pause', minutes: 2 },
];

const D = {
  neckExercise: '10.1016/j.apergo.2023.104216',
  workplaceExercise: '10.1136/bmjopen-2021-054288',
  asthenopia: '10.7189/jogh.16.04053',
  breathing: '10.1177/08980101241273860',
  diaphragmatic: '10.11124/JBISRIR-2017-003848',
  headacheExercise: '10.1016/j.jpain.2021.12.003',
  headachePhysio: '10.22514/jofph.2025.003',
  sittingBreaks: '10.1007/s40279-019-01183-w',
  walkVsStand: '10.1007/s40279-022-01649-4',
  lightAttention: '10.1016/j.biopsycho.2024.108845',
  workplaceLight: '10.1002/14651858.CD012243.pub2',
  dehydration: '10.1249/MSS.0000000000001682',
  exerciseDepression: '10.1002/14651858.CD004366.pub7',
  warmBath: '10.1016/j.smrv.2019.04.008',
  mindfulFoodCues: '10.3390/nu17243885',
  mindfulEating: '10.3389/fnut.2026.1874656',
  stepsProgrammes: '10.3390/ijerph23040522',
};

const opt = (action: NowActionId, strength: Strength, sources: string[]): NowOption => ({ action, strength, sources, review: 'draft' });

export const NOW_STATES: NowState[] = [
  { id: 'neck_back', group: 'body', options: [
    opt('shoulder_neck_reset', 'low', [D.neckExercise, D.workplaceExercise]),
    opt('walk_break', 'indirect', [D.sittingBreaks]),
  ] },
  { id: 'eyes', group: 'body', options: [
    opt('screen_break', 'indirect', [D.asthenopia]),
  ] },
  { id: 'stress', group: 'mind', options: [
    opt('slow_breathing', 'low', [D.breathing, D.diaphragmatic]),
    // In the app from the book (ST01a), but the PubMed pass found no review of it: never offered until it has one.
    opt('physiological_sigh', 'pending', []),
  ] },
  { id: 'headache', group: 'body', options: [
    opt('neck_shoulder_relax', 'low', [D.headacheExercise, D.headachePhysio]),
    // App inference only; no review found.
    opt('drink_water', 'pending', []),
  ] },
  { id: 'stiff', group: 'body', options: [
    opt('walk_break', 'indirect', [D.sittingBreaks, D.walkVsStand]),
  ] },
  { id: 'focus', group: 'mind', options: [
    opt('daylight_break', 'low', [D.lightAttention]),
    opt('drink_water', 'low', [D.dehydration]),
  ] },
  { id: 'low_mood', group: 'mind', talkToPro: true, options: [
    opt('mood_walk', 'indirect', [D.exerciseDepression]),
  ] },
  { id: 'cant_sleep', group: 'sleep', options: [
    opt('warm_shower', 'low', [D.warmBath]),
  ] },
  { id: 'low_energy', group: 'energy', options: [
    opt('daylight_break', 'low', [D.lightAttention, D.workplaceLight]),
    // Sitting-break evidence is about blood glucose, not energy.
    opt('walk_break', 'pending', []),
  ] },
  { id: 'craving', group: 'food', food: true, talkToPro: true, options: [
    opt('mindful_pause', 'low', [D.mindfulFoodCues]),
  ] },
  { id: 'stress_eating', group: 'food', food: true, talkToPro: true, options: [
    opt('mindful_pause', 'low', [D.mindfulEating]),
  ] },
  { id: 'weight_on_mind', group: 'food', food: true, talkToPro: true, options: [
    opt('walk_break', 'indirect', [D.stepsProgrammes]),
    opt('mindful_pause', 'indirect', [D.mindfulEating]),
  ] },
];

/**
 * Red-flag questions per state. They are optional. A "yes" never blocks anything (owner decision):
 * the suggestion still shows, with a small note to check with a doctor. DRAFT: a doctor must write these lists.
 */
export const RED_FLAG_COUNT: Record<NowStateId, number> = {
  neck_back: 4, eyes: 3, stress: 2, headache: 4, stiff: 2, focus: 1,
  low_mood: 3, cant_sleep: 2, low_energy: 2, craving: 2, stress_eating: 2, weight_on_mind: 2,
};

/**
 * Used when nothing else fits (owner decision: the user is never left with nothing).
 * Slow breathing is low-risk, needs no equipment and works anywhere.
 */
export const FALLBACK_OPTION: NowOption = {
  action: 'slow_breathing', strength: 'low', sources: [D.breathing, D.diaphragmatic], review: 'draft',
};

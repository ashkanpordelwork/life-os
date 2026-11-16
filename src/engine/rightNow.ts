import {
  FALLBACK_OPTION, NOW_ACTIONS, NOW_STATES,
  type DayPart, type NowAction, type NowActionId, type NowOption, type NowState, type NowStateId, type Strength,
} from '../data/rightNow';
import { addDays } from './streak';

/**
 * Owner decision (2026-11-16): the app never blocks the user. There is no "stop", no gate and no empty answer.
 * A red flag, a food topic or a health group only adds a small, gentle note next to the suggestion.
 *
 * Doctors supervise the rows, but nobody waits for them. This lock is OFF. Turn it on to offer only options
 * a doctor set to `review: 'approved'` (an empty list then returns `none`).
 */
export const REQUIRE_DOCTOR_REVIEW = false;

/** How many days back the user's own answers count (app choice). */
export const HISTORY_DAYS = 14;
/** "Yes, it helped" this many times in that window offers to make it a weekly habit (app choice). */
export const HABIT_OFFER_AFTER = 3;
/** Alternatives shown next to the main suggestion (app choice). */
export const MAX_ALTERNATIVES = 2;

export interface NowContext {
  /** Time the user has, in minutes. Default 10. */
  minutes?: number;
  /** Is there daylight, or a bright window nearby? Default true. */
  daylight?: boolean;
  /** Default 'day'. */
  dayPart?: DayPart;
  /** Pregnancy, heart condition or illness (the Health check's existing flag). */
  healthRisk?: boolean;
  /** Not asked yet in the app; accepted so the note is ready. */
  under18?: boolean;
  diabetes?: boolean;
  kidney?: boolean;
  weightMedicine?: boolean;
  /** Result of the eating-problem check. A doctor writes the questions. Default 'unknown'. */
  eatingScreen?: 'clear' | 'risk' | 'unknown';
  /** True when the user said yes to a red-flag question for this state. */
  redFlag?: boolean;
}

/** What the user told us after trying something: "Did it help?" */
export interface NowOutcome {
  day: string;
  state: NowStateId;
  action: NowActionId;
  result: 'yes' | 'a_bit' | 'no';
}

export interface NowPick {
  action: NowActionId;
  strength: Strength;
  sources: string[];
  minutes: number;
  /** The weekly habit this could become. */
  habitId?: string;
}

/**
 * A small note next to the suggestion. It never replaces it.
 * - none: nothing to say
 * - hint: a quiet line, "a professional can help too" (food topics, low mood, some health groups)
 * - note: one gentle sentence, shown when the user answered yes to a red-flag question
 */
export type NowAdvice = 'none' | 'hint' | 'note';

export type NowResult =
  | { kind: 'suggest'; main: NowPick; alternatives: NowPick[]; advice: NowAdvice }
  /** Only when the doctor lock is on and nothing is approved, or the state is unknown. */
  | { kind: 'none'; reason: 'no_review' | 'unknown_state' };

export interface NowOptions {
  /** Defaults to REQUIRE_DOCTOR_REVIEW. */
  requireReview?: boolean;
  /** For tests. */
  states?: NowState[];
  actions?: NowAction[];
}

const STRENGTH_POINTS: Record<Exclude<Strength, 'pending'>, number> = { moderate: 3, low: 2, indirect: 1 };
const actionOf = (actions: NowAction[], id: NowActionId) => actions.find((a) => a.id === id);

/** Time, daylight and time of day only make a suggestion more fitting; they can be relaxed. */
function fitsSituation(a: NowAction, ctx: NowContext): boolean {
  if (a.minutes > (ctx.minutes ?? 10)) return false;
  if (a.needsDaylight && ctx.daylight === false) return false;
  if (a.dayParts && !a.dayParts.includes(ctx.dayPart ?? 'day')) return false;
  return true;
}

/** Health safety of one action is never relaxed: we pick a different action instead. */
const safeFor = (a: NowAction, ctx: NowContext) => !(a.blockedByHealthRisk && ctx.healthRisk);

/** The user's own answers for one state and action in the last HISTORY_DAYS days, newest first. */
function recent(history: NowOutcome[], state: NowStateId, action: NowActionId, today: string): NowOutcome[] {
  const from = addDays(today, -(HISTORY_DAYS - 1));
  return history.filter((h) => h.state === state && h.action === action && h.day >= from && h.day <= today)
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

function adviceFor(state: NowState, ctx: NowContext): NowAdvice {
  if (ctx.redFlag) return 'note';
  const group = ctx.under18 || ctx.diabetes || ctx.kidney || ctx.weightMedicine || ctx.healthRisk;
  if (state.talkToPro || (state.food && (group || ctx.eatingScreen === 'risk'))) return 'hint';
  return 'none';
}

/**
 * Pick what to offer for "right now": one main suggestion and up to MAX_ALTERNATIVES others.
 * Order: not pending research, safe for this person's health, fits the moment, your own answers, evidence strength.
 * If nothing fits the moment, the time, light and time-of-day limits are relaxed; if still nothing, slow breathing.
 */
export function rightNow(
  stateId: NowStateId,
  ctx: NowContext = {},
  history: NowOutcome[] = [],
  today = '1970-01-01',
  options: NowOptions = {},
): NowResult {
  const states = options.states ?? NOW_STATES;
  const actions = options.actions ?? NOW_ACTIONS;
  const requireReview = options.requireReview ?? REQUIRE_DOCTOR_REVIEW;
  const state = states.find((s) => s.id === stateId);
  if (!state) return { kind: 'none', reason: 'unknown_state' };

  // Never offer what is still pending research.
  const researched = state.options.filter((o) => o.strength !== 'pending');
  const allowed = researched.filter((o) => !requireReview || o.review === 'approved');
  if (requireReview && allowed.length === 0 && researched.length > 0) return { kind: 'none', reason: 'no_review' };

  type Cand = { o: NowOption; order: number; a: NowAction };
  const withAction = (list: NowOption[]): Cand[] => list
    .map((o, order) => ({ o, order, a: actionOf(actions, o.action) }))
    .filter((c): c is Cand => !!c.a && safeFor(c.a, ctx));

  const base = withAction(allowed);
  let pool = base.filter((c) => fitsSituation(c.a, ctx));
  // Two "no" answers in a row for this state and action: stop offering it for now.
  const notRejected = (c: Cand) => {
    const last = recent(history, stateId, c.o.action, today).slice(0, 2);
    return !(last.length === 2 && last.every((h) => h.result === 'no'));
  };
  pool = pool.filter(notRejected);
  // Relax the moment (time, light, time of day) before giving up, then the rejections, then fall back.
  if (pool.length === 0) pool = base.filter(notRejected);
  if (pool.length === 0) pool = base;
  if (pool.length === 0) pool = withAction([FALLBACK_OPTION]);

  const scored = pool.map((c) => {
    const past = recent(history, stateId, c.o.action, today);
    const yes = past.filter((h) => h.result === 'yes').length;
    const bit = past.filter((h) => h.result === 'a_bit').length;
    const no = past.filter((h) => h.result === 'no').length;
    // Your own answers move an action by at most 2 up or 3 down; evidence strength still matters most.
    const own = Math.min(2, yes + bit * 0.5) - Math.min(3, no);
    return { ...c, score: STRENGTH_POINTS[c.o.strength as Exclude<Strength, 'pending'>] + own };
  }).sort((a, b) => b.score - a.score || a.order - b.order);

  const pick = (c: Cand): NowPick => ({
    action: c.o.action, strength: c.o.strength, sources: c.o.sources, minutes: c.a.minutes, habitId: c.a.habitId,
  });
  return {
    kind: 'suggest',
    main: pick(scored[0]),
    alternatives: scored.slice(1, 1 + MAX_ALTERNATIVES).map(pick),
    advice: adviceFor(state, ctx),
  };
}

/**
 * After the same action helped HABIT_OFFER_AFTER times in HISTORY_DAYS days, offer the matching weekly habit.
 * Returns null when nothing qualifies, or the action has no habit.
 */
export function habitOffer(
  history: NowOutcome[],
  today: string,
  actions: NowAction[] = NOW_ACTIONS,
): { action: NowActionId; habitId: string; times: number } | null {
  const from = addDays(today, -(HISTORY_DAYS - 1));
  const counts = new Map<NowActionId, number>();
  for (const h of history) {
    if (h.result === 'yes' && h.day >= from && h.day <= today) counts.set(h.action, (counts.get(h.action) ?? 0) + 1);
  }
  let best: { action: NowActionId; habitId: string; times: number } | null = null;
  for (const [action, times] of counts) {
    const habitId = actionOf(actions, action)?.habitId;
    if (!habitId || times < HABIT_OFFER_AFTER) continue;
    if (!best || times > best.times) best = { action, habitId, times };
  }
  return best;
}

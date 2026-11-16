import {
  GATE_SAFE_ACTIONS, NOW_ACTIONS, NOW_STATES,
  type DayPart, type NowAction, type NowActionId, type NowState, type NowStateId, type Strength,
} from '../data/rightNow';
import { addDays } from './streak';

/**
 * Safety lock (owner decision): nothing from "right now" is offered until a doctor has approved it.
 * Each option in src/data/rightNow.ts has `review: 'draft' | 'approved'`. Flip an option to 'approved'
 * only after a doctor signed that row in docs/problem-solution-matrix.md.
 */
export const REQUIRE_DOCTOR_REVIEW = true;

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
  /** Not asked yet in the app; accepted so the gate is ready. Any of them closes the food gate. */
  under18?: boolean;
  diabetes?: boolean;
  kidney?: boolean;
  weightMedicine?: boolean;
  /** Result of the eating-problem screen. A doctor writes the questions. Default 'unknown'. */
  eatingScreen?: 'clear' | 'risk' | 'unknown';
  /** True when the user said yes to any red-flag question for this state. */
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

export type NowResult =
  /** A red flag: "talk to a doctor", no tips. */
  | { kind: 'stop'; reason: 'red_flag' }
  /** Food, eating or weight with the gate closed: only calm, non-food options and "talk to a professional". */
  | { kind: 'gate'; gate: 'eating_screen' | 'food_excluded'; safe: NowActionId[]; talkToPro: true }
  /** Nothing to offer (not approved yet, or nothing fits the time, place or health answers). */
  | { kind: 'none'; reason: 'no_review' | 'no_option' }
  | { kind: 'suggest'; main: NowPick; alternatives: NowPick[]; talkToPro: boolean };

export interface NowOptions {
  /** Defaults to REQUIRE_DOCTOR_REVIEW. */
  requireReview?: boolean;
  /** For tests. */
  states?: NowState[];
  actions?: NowAction[];
}

const STRENGTH_POINTS: Record<Exclude<Strength, 'pending'>, number> = { moderate: 3, low: 2, indirect: 1 };
const actionOf = (actions: NowAction[], id: NowActionId) => actions.find((a) => a.id === id);

/** Closed when the user is in a group that needs a doctor's okay, or the eating screen isn't clear. */
function foodGate(ctx: NowContext): 'food_excluded' | 'eating_screen' | null {
  if (ctx.under18 || ctx.diabetes || ctx.kidney || ctx.weightMedicine || ctx.healthRisk) return 'food_excluded';
  if (ctx.eatingScreen !== 'clear') return 'eating_screen';
  return null;
}

/** Does this action fit the user's time, daylight, time of day and health answers? */
function fits(a: NowAction, ctx: NowContext): boolean {
  if (a.minutes > (ctx.minutes ?? 10)) return false;
  if (a.needsDaylight && ctx.daylight === false) return false;
  if (a.dayParts && !a.dayParts.includes(ctx.dayPart ?? 'day')) return false;
  if (a.blockedByHealthRisk && ctx.healthRisk) return false;
  return true;
}

/** The user's own answers for one state and action in the last HISTORY_DAYS days, newest first. */
function recent(history: NowOutcome[], state: NowStateId, action: NowActionId, today: string): NowOutcome[] {
  const from = addDays(today, -(HISTORY_DAYS - 1));
  return history.filter((h) => h.state === state && h.action === action && h.day >= from && h.day <= today)
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/**
 * Pick what to offer for "right now".
 * Order: red flag, then the food gate, then review lock, then what fits, then your own answers, then strength.
 * Returns one main suggestion and up to MAX_ALTERNATIVES others.
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
  if (!state) return { kind: 'none', reason: 'no_option' };

  if (ctx.redFlag) return { kind: 'stop', reason: 'red_flag' };

  if (state.food) {
    const gate = foodGate(ctx);
    if (gate) {
      const safe = GATE_SAFE_ACTIONS.filter((id) => {
        const a = actionOf(actions, id);
        return !!a && fits(a, ctx);
      });
      return { kind: 'gate', gate, safe, talkToPro: true };
    }
  }

  // Never offer what is still pending research.
  const researched = state.options.filter((o) => o.strength !== 'pending');
  const approved = researched.filter((o) => !requireReview || o.review === 'approved');
  if (requireReview && approved.length === 0 && researched.length > 0) return { kind: 'none', reason: 'no_review' };

  const candidates = approved
    .map((o, order) => ({ o, order, a: actionOf(actions, o.action) }))
    .filter((c): c is { o: typeof c.o; order: number; a: NowAction } => !!c.a && fits(c.a, ctx))
    // Two "no" answers in a row for this state and action: stop offering it for now.
    .filter((c) => {
      const last = recent(history, stateId, c.o.action, today).slice(0, 2);
      return !(last.length === 2 && last.every((h) => h.result === 'no'));
    })
    .map((c) => {
      const past = recent(history, stateId, c.o.action, today);
      const yes = past.filter((h) => h.result === 'yes').length;
      const bit = past.filter((h) => h.result === 'a_bit').length;
      const no = past.filter((h) => h.result === 'no').length;
      // Your own answers can move an action by at most 2 up or 3 down; strength still matters most.
      const own = Math.min(2, yes + bit * 0.5) - Math.min(3, no);
      return { ...c, score: STRENGTH_POINTS[c.o.strength as Exclude<Strength, 'pending'>] + own };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order);

  if (candidates.length === 0) return { kind: 'none', reason: 'no_option' };

  const pick = (c: (typeof candidates)[number]): NowPick => ({
    action: c.o.action, strength: c.o.strength, sources: c.o.sources, minutes: c.a.minutes, habitId: c.a.habitId,
  });
  return {
    kind: 'suggest',
    main: pick(candidates[0]),
    alternatives: candidates.slice(1, 1 + MAX_ALTERNATIVES).map(pick),
    talkToPro: !!state.talkToPro || !!state.food,
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

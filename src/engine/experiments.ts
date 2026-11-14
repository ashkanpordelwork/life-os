import { addDays, REST_ID, type DayCheckin } from './streak';

/** Daily check-in, 1–5 each (owner decision: energy, mood, sleep quality, focus). */
export type Metric = 'energy' | 'mood' | 'sleep' | 'focus';
export const METRICS: Metric[] = ['energy', 'mood', 'sleep', 'focus'];
export interface DailyLog { day: string; energy?: number; mood?: number; sleep?: number; focus?: number }

/** Minimum days on each side before we show a pattern (app choice, not from the book). */
export const MIN_DAYS_EACH_SIDE = 3;
/** Smallest change worth showing, as a share of the average (app choice). */
export const MIN_EFFECT = 0.1;

export interface Effect {
  itemId: string;
  metric: Metric;
  withAvg: number;
  withoutAvg: number;
  nWith: number;
  nWithout: number;
  /** (with − without) / without */
  change: number;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Compare a metric on days the patch was done vs logged days it wasn't.
 * Only days with a log for that metric count. Rest days are left out (they're not "not done").
 */
export function effectOf(itemId: string, metric: Metric, checkins: DayCheckin[], logs: DailyLog[]): Effect | null {
  const done = new Set(checkins.filter((c) => c.item_id === itemId).map((c) => c.day));
  const rest = new Set(checkins.filter((c) => c.item_id === REST_ID).map((c) => c.day));
  const withV: number[] = [];
  const withoutV: number[] = [];
  for (const l of logs) {
    const v = l[metric];
    if (typeof v !== 'number' || rest.has(l.day)) continue;
    (done.has(l.day) ? withV : withoutV).push(v);
  }
  if (withV.length < MIN_DAYS_EACH_SIDE || withoutV.length < MIN_DAYS_EACH_SIDE) return null;
  const w = avg(withV);
  const wo = avg(withoutV);
  if (wo === 0) return null;
  return { itemId, metric, withAvg: w, withoutAvg: wo, nWith: withV.length, nWithout: withoutV.length, change: (w - wo) / wo };
}

/** The strongest patterns across patches and metrics, biggest first. */
export function topEffects(itemIds: string[], checkins: DayCheckin[], logs: DailyLog[], limit = 3): Effect[] {
  const all: Effect[] = [];
  for (const id of itemIds) for (const m of METRICS) {
    const e = effectOf(id, m, checkins, logs);
    if (e && Math.abs(e.change) >= MIN_EFFECT) all.push(e);
  }
  return all.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, limit);
}

export interface Experiment { id: string; item_id: string; metric: Metric; start_day: string; days: number }

export interface ExperimentResult {
  /** Days of the experiment that have started (capped at its length). */
  elapsed: number;
  finished: boolean;
  /** Days the patch was done during the experiment. */
  doneDays: number;
  during: number | null;
  before: number | null;
  change: number | null;
}

/** Experiment vs the same number of days just before it started. */
export function experimentResult(e: Experiment, checkins: DayCheckin[], logs: DailyLog[], today: string): ExperimentResult {
  const end = addDays(e.start_day, e.days - 1);
  const elapsed = Math.max(0, Math.min(e.days, Math.round((Date.parse(today) - Date.parse(e.start_day)) / 86_400_000) + 1));
  const beforeStart = addDays(e.start_day, -e.days);
  const vals = (from: string, to: string) => logs.filter((l) => l.day >= from && l.day <= to && typeof l[e.metric] === 'number').map((l) => l[e.metric] as number);
  const during = vals(e.start_day, end < today ? end : today);
  const before = vals(beforeStart, addDays(e.start_day, -1));
  const d = during.length >= MIN_DAYS_EACH_SIDE ? avg(during) : null;
  const b = before.length >= MIN_DAYS_EACH_SIDE ? avg(before) : null;
  const doneDays = new Set(checkins.filter((c) => c.item_id === e.item_id && c.day >= e.start_day && c.day <= end).map((c) => c.day)).size;
  return { elapsed, finished: today > end, doneDays, during: d, before: b, change: d !== null && b ? (d - b) / b : null };
}

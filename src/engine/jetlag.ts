import { fromMinutes, toMinutes } from './timeHint';

/** Book SL15. Short trips (< 2 days): stay on home time (R13). */
export const MIN_TRIP_DAYS = 2;

export interface JetLagPlan {
  direction: 'east' | 'west' | 'none';
  /** Home T-min (≈ 2 h before usual wake), as local time at the destination. */
  tminLocal: string;
  /** Bright-light window at the destination (local time). */
  light?: [string, string];
  /** Dark sunglasses window at the destination (east only). */
  dark?: [string, string];
}

/**
 * Jet-lag plan from the book (SL15):
 * T-min = usual wake − 2 h (home time).
 * East: bright light 1–2 h after home T-min; dark glasses 2–3 h before it.
 * West: bright light 1–2 h before home T-min.
 * `hoursAhead`: destination clock minus home clock (+ = east).
 */
export function jetLagPlan(wake: string, hoursAhead: number): JetLagPlan {
  const tmin = toMinutes(wake) - 120 + hoursAhead * 60;
  const at = (m: number) => fromMinutes(tmin + m);
  if (hoursAhead > 0) return { direction: 'east', tminLocal: at(0), light: [at(60), at(120)], dark: [at(-180), at(-120)] };
  if (hoursAhead < 0) return { direction: 'west', tminLocal: at(0), light: [at(-120), at(-60)] };
  return { direction: 'none', tminLocal: at(0) };
}

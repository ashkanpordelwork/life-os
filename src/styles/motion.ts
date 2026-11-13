import type { Transition } from 'motion/react';

/**
 * Motion tokens. Every animation in the app uses one of these, so the feel stays the same.
 * Shown on /styleguide. Users with "reduce motion" turned on get no movement (MotionConfig in App).
 */
export const motionTokens = {
  /** Taps and small state changes: quick, a little bounce. */
  press: { type: 'spring', stiffness: 520, damping: 30, mass: 0.6 } satisfies Transition,
  /** Things that appear (check marks, chips): springy pop. */
  pop: { type: 'spring', stiffness: 420, damping: 18, mass: 0.7 } satisfies Transition,
  /** Moving between screens. */
  page: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  /** Screen exit: shorter than enter. */
  pageExit: { duration: 0.16, ease: [0.4, 0, 1, 1] } satisfies Transition,
  /** Numbers counting up. */
  count: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  /** Gap between items appearing one after another (lists). */
  stagger: 0.06,
  /** How much a pressed control shrinks. */
  tapScale: 0.97,
} as const;

/** Light haptic tick on phones that support it (Android). Silent elsewhere. */
export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms); } catch { /* not supported */ }
}

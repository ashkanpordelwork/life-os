import type { IconName } from '../components/Icon';

export interface Tool { to: string; key: string; icon: IconName; pro?: boolean }

export const TOOLS = {
  sigh: { to: '/tool/sigh', key: 'sigh', icon: 'air' },
  nsdr: { to: '/tool/nsdr', key: 'nsdr', icon: 'self_improvement' },
  focus: { to: '/tool/focus', key: 'focus', icon: 'bolt', pro: true },
  woop: { to: '/tool/woop', key: 'woop', icon: 'task_alt', pro: true },
  errors85: { to: '/tool/errors', key: 'errors85', icon: 'insights', pro: true },
  selfTest: { to: '/tool/self-test', key: 'selfTest', icon: 'timer', pro: true },
  nutrition: { to: '/tool/nutrition', key: 'nutrition', icon: 'restaurant', pro: true },
  jetlag: { to: '/tool/jet-lag', key: 'jetlag', icon: 'airplane', pro: true },
} satisfies Record<string, Tool>;

/**
 * Which tool opens from which habit (user feedback: "tools should live inside habits").
 * App choice, not from the book. Jet-lag opens from the travel mode banner on Today.
 */
export const HABIT_TOOL: Record<string, Tool> = {
  ST01a: TOOLS.sigh,
  PG01a: TOOLS.sigh,
  ST04: TOOLS.nsdr,
  PG02c: TOOLS.nsdr,
  SL03: TOOLS.nsdr,
  SL14: TOOLS.nsdr,
  FM05: TOOLS.focus,
  PG01b: TOOLS.woop,
  NU02a: TOOLS.nutrition,
  NU02b: TOOLS.nutrition,
  NU03a: TOOLS.nutrition,
};

/** Tools for learning have no habit yet, so they stay in the Library. */
export const LEARNING_TOOLS: Tool[] = [TOOLS.errors85, TOOLS.selfTest];

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { motionTokens } from '../styles/motion';

/**
 * Collapse (added in code). Opens and closes by height without cutting shadows:
 * content is clipped only while it moves, then overflow goes back to visible,
 * so a card's shadow is never cut once it has opened. Use inside AnimatePresence, with a `key`.
 * Rule: never wrap a card in a plain `overflow: hidden` box (see CLAUDE.md, UI rules).
 */
export function Collapse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
      animate={{ height: 'auto', opacity: 1, transition: motionTokens.page, transitionEnd: { overflow: 'visible' } }}
      exit={{ height: 0, opacity: 0, overflow: 'hidden', transition: motionTokens.pageExit }}
    >
      {children}
    </motion.div>
  );
}

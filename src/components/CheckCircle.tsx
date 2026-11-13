import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { motionTokens } from '../styles/motion';
import './CheckCircle.css';

/**
 * Check target used by HabitCard and PatchCard (Figma "Check" layer).
 * 44x44 touch area, 28px circle. Done = status/success fill with a white check.
 * Motion: the fill pops in with a spring and a soft ring spreads out once.
 */
export function CheckCircle({ done }: { done: boolean }) {
  return (
    <span className="check-target" aria-hidden="true">
      <span className="check-circle">
        <AnimatePresence initial={false}>
          {done && (
            <motion.span
              key="fill"
              className="check-circle__fill"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={motionTokens.pop}
            >
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...motionTokens.pop, delay: 0.06 }} style={{ display: 'flex' }}>
                <Icon name="check" size={18} />
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {done && (
            <motion.span
              key="ring"
              className="check-circle__ring"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { motionTokens } from '../styles/motion';
import './Stepper.css';

type StepperProps = {
  /** Shown big in the middle, already formatted (e.g. "5,000 steps"). */
  display: string;
  onLess: () => void;
  onMore: () => void;
  lessDisabled?: boolean;
  moreDisabled?: boolean;
  lessLabel: string;
  moreLabel: string;
};

/**
 * Stepper: − value +. Two 48px round buttons around a big number.
 * Used to log how much (steps, ml, g) and to pick a personal goal.
 */
export function Stepper({ display, onLess, onMore, lessDisabled, moreDisabled, lessLabel, moreLabel }: StepperProps) {
  return (
    <div className="stepper">
      <motion.button type="button" className="stepper__btn" aria-label={lessLabel} disabled={lessDisabled} onClick={onLess} whileTap={lessDisabled ? undefined : { scale: 0.9 }} transition={motionTokens.press}>
        <Icon name="remove" size={22} />
      </motion.button>
      <span className="stepper__value text-title-l text-primary" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={display} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}>
            {display}
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.button type="button" className="stepper__btn" aria-label={moreLabel} disabled={moreDisabled} onClick={onMore} whileTap={moreDisabled ? undefined : { scale: 0.9 }} transition={motionTokens.press}>
        <Icon name="add" size={22} />
      </motion.button>
    </div>
  );
}

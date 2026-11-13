import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { motionTokens } from '../styles/motion';
import './AnswerRow.css';

type AnswerRowProps = {
  label: string;
  /** Figma property `State`: Off | On */
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * AnswerRow (Figma 53:177)
 * Single-choice answer for the starting-score questions.
 * Selected state changes fill, border and radio, not colour alone.
 * Put several inside an element with role="radiogroup".
 * Motion: shrinks while pressed; the radio check pops in.
 */
export function AnswerRow({ label, selected = false, onSelect }: AnswerRowProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`answer-row${selected ? ' answer-row--on' : ''}`}
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      transition={motionTokens.press}
    >
      <span className="answer-row__label text-body-m-strong">{label}</span>
      <span className="answer-row__radio" aria-hidden="true">
        <AnimatePresence initial={false}>
          {selected && (
            <motion.span className="answer-row__dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={motionTokens.pop}>
              <Icon name="check" size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

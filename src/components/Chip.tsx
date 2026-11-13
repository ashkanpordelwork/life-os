import { motion } from 'motion/react';
import { motionTokens } from '../styles/motion';
import './Chip.css';

type ChipProps = {
  label: string;
  /** Figma property `Selected` */
  selected?: boolean;
  onToggle?: () => void;
};

/**
 * Chip (Figma 44:25)
 * Filter / symptom picker. Selected state also changes the border, not only the colour.
 * Motion: shrinks while pressed; a small pop when it becomes selected.
 */
export function Chip({ label, selected = false, onToggle }: ChipProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      className={`chip${selected ? ' chip--selected' : ''}`}
      onClick={onToggle}
      whileTap={{ scale: motionTokens.tapScale }}
      animate={selected ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={motionTokens.press}
    >
      <span className="text-body-s">{label}</span>
    </motion.button>
  );
}

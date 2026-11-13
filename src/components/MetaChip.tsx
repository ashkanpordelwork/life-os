import { motion } from 'motion/react';
import { Icon, type IconName } from './Icon';
import { motionTokens } from '../styles/motion';
import './MetaChip.css';

type MetaChipProps = {
  icon: IconName;
  label: string;
  /** When set, the chip is a button (e.g. "Tiny mode" on Today). */
  onClick?: () => void;
  /** Button chips only: shows the on state (brand border and text). */
  pressed?: boolean;
};

/**
 * MetaChip (Figma 61:1067)
 * Small fact chip: icon + mono value (duration, cue, evidence).
 * Can also be a small toggle button (Tiny mode).
 */
export function MetaChip({ icon, label, onClick, pressed }: MetaChipProps) {
  const inner = (
    <>
      <span className="meta-chip__icon"><Icon name={icon} size={16} /></span>
      <span className="text-mono-caption meta-chip__label">{label}</span>
    </>
  );
  if (!onClick) return <span className="meta-chip">{inner}</span>;
  return (
    <motion.button type="button" className={`meta-chip meta-chip--button${pressed ? ' meta-chip--on' : ''}`} aria-pressed={pressed} onClick={onClick} whileTap={{ scale: 0.95 }} transition={motionTokens.press}>
      {inner}
    </motion.button>
  );
}

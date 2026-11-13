import { motion } from 'motion/react';
import { Icon, type IconName } from './Icon';
import { motionTokens } from '../styles/motion';
import './VersionTab.css';

type VersionTabProps = {
  icon: IconName;
  label: string;
  time: string;
  /** Figma property `State`: Off | On */
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * VersionTab (Figma 61:1084)
 * Pick Tiny / Standard / Stretch. Selected state changes fill, border and text colour.
 * Motion: shrinks while pressed; the icon bounces when selected.
 */
export function VersionTab({ icon, label, time, selected = false, onSelect }: VersionTabProps) {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`version-tab${selected ? ' version-tab--on' : ''}`}
      onClick={onSelect}
      whileTap={{ scale: motionTokens.tapScale }}
      transition={motionTokens.press}
    >
      <motion.span className="version-tab__icon" animate={selected ? { y: [0, -4, 0] } : { y: 0 }} transition={motionTokens.pop}>
        <Icon name={icon} size={20} />
      </motion.span>
      <span className="text-body-s text-primary">{label}</span>
      <span className="version-tab__time text-mono-caption">{time}</span>
    </motion.button>
  );
}

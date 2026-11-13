import { motion } from 'motion/react';
import { Icon, type IconName } from './Icon';
import { motionTokens } from '../styles/motion';
import './IconButton.css';

/**
 * IconButton (Figma "IconButton" layer in TopBar and Today header)
 * 44px glass circle with a 24px icon in text/primary.
 */
export function IconButton({ icon, label, onClick }: { icon: IconName; label: string; onClick?: () => void }) {
  return (
    <motion.button type="button" className="icon-button" aria-label={label} onClick={onClick} whileTap={{ scale: 0.92 }} transition={motionTokens.press}>
      <Icon name={icon} size={24} className="icon-button__icon" />
    </motion.button>
  );
}

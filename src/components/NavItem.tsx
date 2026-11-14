import { motion } from 'motion/react';
import { Icon, type IconName } from './Icon';
import { motionTokens } from '../styles/motion';
import './NavItem.css';

type NavItemProps = {
  label: string;
  icon: IconName;
  /** Figma property `Active` */
  active?: boolean;
  onClick?: () => void;
  /** data-tour target for the guided tour. */
  tour?: string;
};

/**
 * NavItem (Figma 45:16)
 * Bottom navigation item. Always icon + label.
 * Glyph colour is text/brand when active, text/secondary when not.
 * Motion: the soft active background slides between items (shared layout).
 */
export function NavItem({ label, icon, active = false, onClick, tour }: NavItemProps) {
  return (
    <motion.button
      type="button"
      className={`nav-item${active ? ' nav-item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      data-tour={tour}
      whileTap={{ scale: 0.94 }}
      transition={motionTokens.press}
    >
      {active && <motion.span layoutId="nav-active" className="nav-item__bg" transition={motionTokens.press} />}
      <Icon name={icon} size={24} />
      <span className="text-caption">{label}</span>
    </motion.button>
  );
}

import { motion } from 'motion/react';
import { motionTokens } from '../styles/motion';
import './Toggle.css';

type ToggleProps = {
  /** Figma property `State`: Off | On */
  on: boolean;
  onChange?: (on: boolean) => void;
  label: string;
};

/**
 * Toggle (Figma 2014:1459)
 * On/off switch for a single setting (reminders, notifications).
 * Use only for instant changes; never for choices that need a Save button.
 * Track uses action/primary when On, border/default when Off. Min touch area 44.
 * Motion: the knob slides with a spring.
 */
export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle${on ? ' toggle--on' : ''}`} onClick={() => onChange?.(!on)}>
      <span className="toggle__track">
        <motion.span className="toggle__knob" animate={{ x: on ? 22 : 0 }} transition={motionTokens.press} />
      </span>
    </button>
  );
}

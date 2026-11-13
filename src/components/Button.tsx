import { motion, type HTMLMotionProps } from 'motion/react';
import { motionTokens } from '../styles/motion';
import './Button.css';

export type ButtonType = 'Primary' | 'Secondary' | 'Ghost';

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'type' | 'children'> & {
  /** Figma property `Type` */
  variant?: ButtonType;
  label: string;
  /** Stretch to the full width of the parent (used for screen actions). */
  block?: boolean;
  /** Shows a small spinner and blocks taps while something is saving. */
  busy?: boolean;
  type?: 'button' | 'submit';
};

/**
 * Button (Figma 44:20)
 * Primary action = Primary. Use Secondary for alternatives, Ghost for low-emphasis.
 * Height 48 (touch target >= 44). White-on-orange text passes 4.5:1 only on the Primary fill.
 * States: Default, Pressed (shrinks while held), Disabled (`disabled`), Busy (`busy`).
 */
export function Button({ variant = 'Primary', label, block, busy, className, disabled, type = 'button', ...rest }: ButtonProps) {
  const cls = ['btn', `btn--${variant.toLowerCase()}`, block && 'btn--block', busy && 'btn--busy', className].filter(Boolean).join(' ');
  return (
    <motion.button
      type={type}
      className={cls}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      whileTap={disabled || busy ? undefined : { scale: motionTokens.tapScale }}
      transition={motionTokens.press}
      {...rest}
    >
      {busy && <span className="btn__spinner" aria-hidden="true" />}
      <span className="text-body-m-strong">{label}</span>
    </motion.button>
  );
}

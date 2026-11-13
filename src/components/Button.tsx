import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export type ButtonType = 'Primary' | 'Secondary' | 'Ghost';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma property `Type` */
  variant?: ButtonType;
  label: string;
  /** Stretch to the full width of the parent (used for screen actions). */
  block?: boolean;
};

/**
 * Button (Figma 44:20)
 * Primary action = Primary. Use Secondary for alternatives, Ghost for low-emphasis.
 * Height 48 (touch target >= 44). White-on-orange text passes 4.5:1 only on the Primary fill.
 * States: Default, Pressed (:active), Disabled (`disabled`).
 */
export function Button({ variant = 'Primary', label, block, className, ...rest }: ButtonProps) {
  const cls = ['btn', `btn--${variant.toLowerCase()}`, block && 'btn--block', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      <span className="text-body-m-strong">{label}</span>
    </button>
  );
}

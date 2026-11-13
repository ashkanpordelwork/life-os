import { motion } from 'motion/react';
import { IconTile, type Glyph } from './IconTile';
import { CheckCircle } from './CheckCircle';
import { motionTokens } from '../styles/motion';
import './glass.css';
import './PatchCard.css';

type PatchCardProps = {
  glyph: Glyph;
  title: string;
  meta: string;
  /** Figma property `State`: Todo | Done. On Pick patches, Done = picked. */
  done?: boolean;
  /** Tap on the check circle (or on the whole card when `onOpen` is not set). */
  onToggle?: () => void;
  /** Tap on the card body opens the patch (Today). */
  onOpen?: () => void;
  disabled?: boolean;
  /** Accessible name for the check button when the card can also be opened. */
  checkLabel?: string;
};

/**
 * PatchCard (Figma 61:1060)
 * Icon-led patch row. Set the glyph on the nested IconTile.
 * Keep Title short (2-3 words); details live on the patch screen.
 * Two ways to use it:
 * - Pick patches: whole card toggles (only `onToggle`).
 * - Today: body opens the patch (`onOpen`), the circle ticks it (`onToggle`).
 * Motion: card shrinks a little while pressed; the check pops (CheckCircle).
 */
export function PatchCard({ glyph, title, meta, done = false, onToggle, onOpen, disabled, checkLabel }: PatchCardProps) {
  const body = (
    <>
      <IconTile glyph={glyph} size="M" />
      <span className="patch-card__content">
        <span className="text-title-s text-primary">{title}</span>
        <span className="text-mono-caption text-secondary">{meta}</span>
      </span>
    </>
  );

  if (!onOpen) {
    return (
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-disabled={disabled || undefined}
        className="patch-card glass-card"
        onClick={disabled ? undefined : onToggle}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={motionTokens.press}
      >
        {body}
        <CheckCircle done={done} />
      </motion.button>
    );
  }

  return (
    <motion.div className="patch-card glass-card" whileTap={{ scale: 0.98 }} transition={motionTokens.press}>
      <button type="button" className="patch-card__open" onClick={onOpen}>{body}</button>
      <button type="button" role="checkbox" aria-checked={done} aria-label={checkLabel ?? title} className="patch-card__check" onClick={onToggle}>
        <CheckCircle done={done} />
      </button>
    </motion.div>
  );
}

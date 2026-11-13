import { IconTile, type Glyph } from './IconTile';
import { CheckCircle } from './CheckCircle';
import './glass.css';
import './PatchCard.css';

type PatchCardProps = {
  glyph: Glyph;
  title: string;
  meta: string;
  /** Figma property `State`: Todo | Done. On Pick patches, Done = picked. */
  done?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
};

/**
 * PatchCard (Figma 61:1060)
 * Icon-led patch row. Set the glyph on the nested IconTile.
 * Keep Title short (2-3 words); details live on the patch screen.
 */
export function PatchCard({ glyph, title, meta, done = false, onToggle, disabled }: PatchCardProps) {
  return (
    <button type="button" role="checkbox" aria-checked={done} aria-disabled={disabled || undefined} className="patch-card glass-card" onClick={disabled ? undefined : onToggle}>
      <IconTile glyph={glyph} size="M" />
      <span className="patch-card__content">
        <span className="text-title-s text-primary">{title}</span>
        <span className="text-mono-caption text-secondary">{meta}</span>
      </span>
      <CheckCircle done={done} />
    </button>
  );
}

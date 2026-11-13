import './HeatCell.css';

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/**
 * HeatCell (Figma 44:57)
 * One day in the contribution graph. 0 = nothing, 4 = all active habits done.
 * Detail view always shows the count, not only colour.
 * size sm = 10px (Done week), lg = 19px (Progress grid, tappable).
 */
export function HeatCell({ level, label, size = 'sm', onClick }: { level: HeatLevel; label?: string; size?: 'sm' | 'lg'; onClick?: () => void }) {
  const cls = `heat heat--${level} heat--${size}`;
  if (onClick) return <button type="button" className={cls} aria-label={label} onClick={onClick} />;
  return <span className={cls} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

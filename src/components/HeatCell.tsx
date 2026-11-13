import './HeatCell.css';

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/**
 * HeatCell (Figma 44:57)
 * One day in the contribution graph. 0 = nothing, 4 = all active habits done.
 * Detail view always shows the count, not only colour.
 */
export function HeatCell({ level, label }: { level: HeatLevel; label?: string }) {
  return <span className={`heat heat--${level}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

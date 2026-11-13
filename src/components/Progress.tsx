import './Progress.css';

/**
 * Progress (Figma 44:58)
 * Override the Fill width on the instance to show progress. `value` is 0 to 1.
 */
export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className="progress__fill" style={{ inlineSize: `${pct}%` }} />
    </div>
  );
}

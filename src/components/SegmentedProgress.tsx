import './SegmentedProgress.css';

/**
 * SegmentedProgress (from Figma "Segments" layers on onboarding screens)
 * A row of 4px bars. `filled` bars use action/primary, the rest progress/track.
 * Used for: onboarding steps (6), area score (5), Sprint days (14).
 */
export function SegmentedProgress({ total, filled, label }: { total: number; filled: number; label?: string }) {
  return (
    <div className="segments" role="img" aria-label={label ?? `${filled} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`segments__bar${i < filled ? ' segments__bar--on' : ''}`} />
      ))}
    </div>
  );
}

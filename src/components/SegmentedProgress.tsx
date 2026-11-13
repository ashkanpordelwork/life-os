import { motion } from 'motion/react';
import './SegmentedProgress.css';

export type SegmentsVariant = 'steps' | 'today' | 'sprint';

type SegmentedProgressProps = {
  total: number;
  filled: number;
  label?: string;
  /**
   * steps: 4px bars that share the width (onboarding steps, area score, Sprint ready).
   * today: 24 x 6 bars (Today header, one per patch).
   * sprint: 18 x 8 bars (Sprint strip, one per day).
   */
  variant?: SegmentsVariant;
};

/**
 * SegmentedProgress (from Figma "Segments" layers)
 * A row of bars. `filled` bars use action/primary, the rest progress/track.
 * Motion: a newly filled bar fills from the start side.
 */
export function SegmentedProgress({ total, filled, label, variant = 'steps' }: SegmentedProgressProps) {
  return (
    <div className={`segments segments--${variant}`} role="img" aria-label={label ?? `${filled} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="segments__bar">
          <motion.span
            className="segments__fill"
            initial={false}
            animate={{ scaleX: i < filled ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i < filled ? Math.min(i, 6) * 0.03 : 0 }}
          />
        </span>
      ))}
    </div>
  );
}

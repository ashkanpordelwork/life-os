import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import './Confetti.css';

const COLORS = ['brand', 'move', 'nutrition', 'sleep', 'mind', 'gold'] as const;

/**
 * Confetti (added in code). A one-time burst for big moments (Sprint start).
 * Decorative, ignores taps, and shows nothing when the user prefers reduced motion.
 */
export function Confetti({ count = 28 }: { count?: number }) {
  const reduce = useReducedMotion();
  // Fixed pseudo-random spread so it looks the same on every render.
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    return {
      x: (r(1) - 0.5) * 340,
      y: 260 + r(2) * 320,
      rot: (r(3) - 0.5) * 720,
      delay: r(4) * 0.25,
      w: 6 + Math.round(r(5) * 6),
      round: r(6) > 0.6,
      color: COLORS[i % COLORS.length],
    };
  }), [count]);
  if (reduce) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`confetti__piece confetti__piece--${p.color}${p.round ? ' confetti__piece--round' : ''}`}
          style={{ inlineSize: p.w, blockSize: p.round ? p.w : p.w * 1.6 }}
          initial={{ x: 0, y: -10, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: [0, p.x * 0.6, p.x], y: [-10, -60 - p.y * 0.2, p.y], rotate: p.rot, opacity: [1, 1, 0], scale: 1 }}
          transition={{ duration: 1.8, delay: p.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

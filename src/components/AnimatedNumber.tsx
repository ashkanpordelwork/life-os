import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { motionTokens } from '../styles/motion';

/**
 * AnimatedNumber (motion)
 * Counts from the previous value to the new one. `decimals` keeps e.g. "2.4".
 */
export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setShown(value); from.current = value; return; }
    const controls = animate(from.current, value, {
      ...motionTokens.count,
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <>{shown.toFixed(decimals)}</>;
}

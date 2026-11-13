import { useCallback, useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { haptic } from '../styles/motion';
import './WheelPicker.css';

const ROW = 40; // px, one row of the wheel
const VISIBLE = 5; // rows shown; the middle one is the value

interface ColumnProps {
  values: string[];
  index: number;
  onChange: (index: number) => void;
  label: string;
}

/** One spinning column. Scroll-snap does the physics; we only tilt the rows like a drum. */
function WheelColumn({ values, index, onChange, label }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef(index);
  const frame = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const paint = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop;
    const rows = el.children;
    for (let i = 0; i < rows.length; i++) {
      const d = (i * ROW - top) / ROW; // rows away from the middle
      const row = rows[i] as HTMLElement;
      const a = Math.min(Math.abs(d), 3);
      row.style.transform = `rotateX(${(-d * 20).toFixed(1)}deg) scale(${(1 - a * 0.06).toFixed(3)})`;
      row.style.opacity = String(Math.max(0.15, 1 - a * 0.32));
    }
    const i = Math.max(0, Math.min(values.length - 1, Math.round(top / ROW)));
    if (i !== current.current) {
      current.current = i;
      haptic(5);
    }
  }, [values.length]);

  // Jump to the value when it changes from outside (or on first paint).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || Math.round(el.scrollTop / ROW) === index) { paint(); return; }
    current.current = index;
    el.scrollTop = index * ROW;
    paint();
  }, [index, paint]);

  useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(settle.current); }, []);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    clearTimeout(settle.current);
    // Report the value once the wheel has come to rest.
    settle.current = setTimeout(() => {
      if (current.current !== index) onChange(current.current);
    }, 120);
  };

  const step = (n: number) => {
    const next = Math.max(0, Math.min(values.length - 1, index + n));
    ref.current?.scrollTo({ top: next * ROW, behavior: 'smooth' });
    onChange(next);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
  };

  return (
    <div
      className="wheel__col"
      ref={ref}
      onScroll={onScroll}
      onKeyDown={onKey}
      tabIndex={0}
      role="spinbutton"
      aria-label={label}
      aria-valuenow={Number(values[index])}
      aria-valuetext={values[index]}
      aria-valuemin={Number(values[0])}
      aria-valuemax={Number(values[values.length - 1])}
    >
      {values.map((v, i) => (
        <div key={v} className="wheel__row text-title-m" onClick={() => step(i - index)} aria-hidden="true">{v}</div>
      ))}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

/**
 * WheelPicker (added in code, owner request: “like setting the time on iPhone”).
 * Hour and minute drums with a highlight band in the middle. 24-hour time, minutes in steps.
 * Value is "HH:MM".
 */
export function WheelPicker({ value, onChange, label, minuteStep = 5 }: { value: string; onChange: (v: string) => void; label: string; minuteStep?: number }) {
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => String(i * minuteStep).padStart(2, '0'));
  const [h, m] = value.split(':').map(Number);
  const hi = Math.max(0, Math.min(23, h || 0));
  const mi = Math.max(0, Math.min(minutes.length - 1, Math.round((m || 0) / minuteStep)));
  const set = (hh: number, mm: number) => onChange(`${HOURS[hh]}:${minutes[mm]}`);

  return (
    <div className="wheel" role="group" aria-label={label} style={{ ['--wheel-row' as string]: `${ROW}px`, ['--wheel-rows' as string]: VISIBLE }}>
      <div className="wheel__band" aria-hidden="true" />
      <WheelColumn values={HOURS} index={hi} onChange={(i) => set(i, mi)} label={`${label}, hour`} />
      <span className="wheel__colon text-title-m text-primary" aria-hidden="true">:</span>
      <WheelColumn values={minutes} index={mi} onChange={(i) => set(hi, i)} label={`${label}, minute`} />
    </div>
  );
}

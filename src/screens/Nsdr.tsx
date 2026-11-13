import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { StepList } from '../components/StepList';
import { TopBar } from '../components/TopBar';
import { t, tList } from '../i18n';
import { haptic } from '../styles/motion';
import './library.css';

/** Book (SL08 / ST03): 10, 20 or 30 minutes, lying down, eyes closed. */
const LENGTHS = [10, 20, 30] as const;

/** A soft two-note chime made in the browser (no sound file). */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = 'sine';
      const at = ctx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.15, at + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, at + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(at);
      o.stop(at + 1.7);
    });
  } catch { /* no audio */ }
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * NSDR timer (designed in code). The book uses a guided audio; the app has none yet,
 * so it gives the book's how-to plus a quiet timer with a soft chime at the end.
 */
export function Nsdr() {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState<number>(10);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const s = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) { setEndAt(null); setDone(true); chime(); haptic(200); lock.current?.release().catch(() => {}); }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endAt]);

  useEffect(() => () => { lock.current?.release().catch(() => {}); }, []);

  const start = async () => {
    setDone(false);
    setEndAt(Date.now() + minutes * 60_000);
    try {
      // Keep the screen on so the timer and chime still run.
      const wl = (navigator as unknown as { wakeLock?: { request: (k: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      lock.current = (await wl?.request('screen')) ?? null;
    } catch { /* not supported */ }
  };
  const stop = () => { setEndAt(null); lock.current?.release().catch(() => {}); };

  const total = minutes * 60;
  const running = endAt !== null;
  const frac = running ? left / total : done ? 0 : 1;
  const R = 92;
  const C = 2 * Math.PI * R;

  return (
    <Screen align="center">
      <TopBar title={t('nsdr.title')} onBack={() => { stop(); navigate('/library'); }} />
      {!running && !done && (
        <div className="chip-wrap tool__reps" role="radiogroup" aria-label={t('nsdr.length')}>
          {LENGTHS.map((n) => <Chip key={n} label={t('time.minutes', { n })} selected={minutes === n} onToggle={() => setMinutes(n)} />)}
        </div>
      )}
      <div className="tool__stage">
        <svg className="tool__ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="tool__ring-track" cx="100" cy="100" r={R} />
          <motion.circle
            className="tool__ring-fill"
            cx="100" cy="100" r={R}
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - frac) }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>
        <motion.div className="tool__breath" animate={running ? { scale: [0.9, 1, 0.9] } : { scale: 0.9 }} transition={running ? { duration: 10, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }} />
        <p className="tool__time text-display-xl text-primary" role="timer" aria-live="off">{mmss(running ? left : done ? 0 : total)}</p>
      </div>
      {done ? (
        <p className="text-title-m text-primary text-center" role="status">{t('nsdr.done')}</p>
      ) : (
        <GlassPanel gap={8}>
          <StepList steps={tList('nsdr.steps')} />
        </GlassPanel>
      )}
      <Spacer />
      {!running && <Button block label={done ? t('nsdr.again') : t('nsdr.start')} onClick={start} />}
      {running && <Button block variant="Ghost" label={t('nsdr.stop')} onClick={stop} />}
      {done && <Button block variant="Ghost" label={t('sigh.close')} onClick={() => navigate('/library')} />}
    </Screen>
  );
}

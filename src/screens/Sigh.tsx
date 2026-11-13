import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { t } from '../i18n';
import { haptic, motionTokens } from '../styles/motion';
import './library.css';

/** Book (ST01, protocol 1): 1–3 sighs in a row. */
const REPS = [1, 2, 3] as const;

/**
 * Seconds per phase. Not from the book: it gives the pattern (deep inhale, short second inhale,
 * long full exhale) but no seconds. The owner approved this pace.
 */
export const SIGH_PACE = { inhale: 2.5, top: 0.8, exhale: 6 } as const;

type Phase = 'ready' | 'inhale' | 'top' | 'exhale' | 'done';
const SCALE: Record<Phase, number> = { ready: 0.62, inhale: 1, top: 1.14, exhale: 0.62, done: 0.62 };

/** Physiological sigh, guided (designed in code). The circle fills and empties with the breath. */
export function Sigh() {
  const navigate = useNavigate();
  const [reps, setReps] = useState<number>(3);
  const [phase, setPhase] = useState<Phase>('ready');
  const [rep, setRep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const run = (n: number) => {
    setRep(n);
    setPhase('inhale'); haptic(15);
    timer.current = setTimeout(() => {
      setPhase('top'); haptic(10);
      timer.current = setTimeout(() => {
        setPhase('exhale'); haptic(25);
        timer.current = setTimeout(() => {
          if (n < reps) run(n + 1);
          else { setPhase('done'); haptic(30); }
        }, SIGH_PACE.exhale * 1000);
      }, SIGH_PACE.top * 1000);
    }, SIGH_PACE.inhale * 1000);
  };

  const stop = () => { clearTimeout(timer.current); setPhase('ready'); setRep(0); };
  const duration = phase === 'inhale' ? SIGH_PACE.inhale : phase === 'top' ? SIGH_PACE.top : phase === 'exhale' ? SIGH_PACE.exhale : 0.6;
  const running = phase === 'inhale' || phase === 'top' || phase === 'exhale';

  return (
    <Screen align="center">
      <TopBar title={t('sigh.title')} onBack={() => { stop(); navigate('/library'); }} />
      {phase === 'ready' && (
        <div className="chip-wrap tool__reps" role="radiogroup" aria-label={t('sigh.reps')}>
          {REPS.map((n) => <Chip key={n} label={t('sigh.repsN', { n })} selected={reps === n} onToggle={() => setReps(n)} />)}
        </div>
      )}
      {running && <SegmentedProgress total={reps} filled={rep} />}
      <div className="tool__stage">
        <motion.div
          className="tool__halo"
          animate={{ scale: SCALE[phase] * 1.18, opacity: running ? 0.6 : 0.3 }}
          transition={{ duration, ease: phase === 'exhale' ? [0.33, 0, 0.2, 1] : [0.4, 0, 0.2, 1] }}
        />
        <motion.div
          className="tool__orb"
          animate={{ scale: SCALE[phase] }}
          transition={{ duration, ease: phase === 'exhale' ? [0.33, 0, 0.2, 1] : [0.4, 0, 0.2, 1] }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            className="tool__phase text-title-l text-primary"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: motionTokens.page }}
            exit={{ opacity: 0, y: -6, transition: motionTokens.pageExit }}
          >
            {t(`sigh.phase.${phase}`)}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-body-s text-secondary text-center tool__hint">{t(`sigh.hint.${phase}`)}</p>
      <Spacer />
      {phase === 'ready' && <Button block label={t('sigh.start')} onClick={() => run(1)} />}
      {running && <Button block variant="Ghost" label={t('sigh.stop')} onClick={stop} />}
      {phase === 'done' && (
        <>
          <Button block label={t('sigh.again')} onClick={() => run(1)} />
          <Button block variant="Ghost" label={t('sigh.close')} onClick={() => navigate('/library')} />
        </>
      )}
      <p className="text-body-s text-secondary text-center">{t('sigh.safety')}</p>
    </Screen>
  );
}

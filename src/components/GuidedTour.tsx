import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import { motionTokens } from '../styles/motion';
import { Button } from './Button';
import { Mascot, type MascotName } from './Mascot';
import { SegmentedProgress } from './SegmentedProgress';
import { TextButton } from './TextButton';
import './GuidedTour.css';

export interface TourStep { target: string; mascot: MascotName }

const PAD = 8;

/**
 * GuidedTour (designed in code, owner decision): a spotlight on the real screen.
 * The page dims, one element stays bright (found by data-tour), and a small card explains it.
 * Steps whose element isn't on screen are skipped. Esc or Skip ends it.
 */
export function GuidedTour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[idx];

  const measure = useCallback(() => {
    const el = step && document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) { setRect(null); return; }
    setRect(el.getBoundingClientRect());
  }, [step]);

  // Bring the element into view, then measure once it has settled.
  useEffect(() => {
    if (!step) { onDone(); return; }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) { setIdx((i) => i + 1); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setTimeout(measure, 380);
    return () => clearTimeout(id);
  }, [idx, step, measure, onDone]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('keydown', onKey);
    };
  }, [measure, onDone]);

  if (!step) return null;
  const last = idx === steps.length - 1;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  // Card goes below the spotlight, or above it when it sits in the lower half.
  const below = !rect || rect.bottom < vh * 0.5;
  const cardStyle: React.CSSProperties = rect
    ? below
      ? { top: Math.min(rect.bottom + PAD + 14, vh - 240) }
      : { bottom: Math.max(16, vh - rect.top + PAD + 14) }
    : { top: '40%' };

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('tour.label')}>
      <AnimatePresence mode="wait">
        {rect && (
          <motion.div
            key={step.target}
            className="tour__spot"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1, top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
            exit={{ opacity: 0 }}
            transition={motionTokens.page}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${step.target}`}
          className="tour__card glass-card"
          style={cardStyle}
          initial={{ opacity: 0, y: below ? -10 : 10 }}
          animate={{ opacity: 1, y: 0, transition: motionTokens.page }}
          exit={{ opacity: 0, transition: motionTokens.pageExit }}
        >
          <div className="tour__head">
            <Mascot name={step.mascot} size={64} animated />
            <div className="tour__text">
              <span className="text-mono-label text-brand">{t('tour.count', { n: idx + 1, total: steps.length })}</span>
              <h2 className="text-title-s text-primary">{t(`tour.steps.${step.target}.title`)}</h2>
              <p className="text-body-s text-secondary">{t(`tour.steps.${step.target}.body`)}</p>
            </div>
          </div>
          <SegmentedProgress variant="steps" total={steps.length} filled={idx + 1} label={t('tour.count', { n: idx + 1, total: steps.length })} />
          <div className="tour__actions">
            <TextButton label={t('tour.skip')} onClick={onDone} />
            <Button label={last ? t('tour.done') : t('tour.next')} onClick={() => (last ? onDone() : setIdx(idx + 1))} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}

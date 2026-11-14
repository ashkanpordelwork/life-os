import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type PanInfo } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import { haptic, motionTokens } from '../styles/motion';
import { Button } from './Button';
import { Confetti } from './Confetti';
import { Mascot, type MascotName } from './Mascot';
import { TextButton } from './TextButton';
import './GuidedTour.css';

/**
 * One tour step. `target` names a [data-tour] element (no target = a centred card).
 * `selector` overrides how the element is found. `action: 'tap'` waits for the user to tap it.
 */
export interface TourStep { key: string; mascot: MascotName; target?: string; selector?: string; action?: 'tap' }

const PAD = 8;
const SPRING = { stiffness: 260, damping: 30, mass: 0.9 };

const find = (s: TourStep) => (s.selector || s.target ? document.querySelector<HTMLElement>(s.selector ?? `[data-tour="${s.target}"]`) : null);

/**
 * GuidedTour (designed in code, owner decision): a spotlight on the real screen.
 * - The page dims and blurs; a rounded hole (same corners as the element) springs from step to step.
 * - A card with a pointer follows the spotlight. Swipe it left/right to move; Esc or Skip ends it.
 * - Tap steps let the user do the real thing (tick a patch); the tour notices and moves on.
 */
export function GuidedTour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number; r: number } | null>(null);
  const [success, setSuccess] = useState(false);
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);
  const step = steps[idx];
  const last = idx === steps.length - 1;

  // Spotlight geometry as springs, so the hole glides between targets and can be interrupted.
  const x = useSpring(useMotionValue(vw / 2), SPRING);
  const y = useSpring(useMotionValue(vh / 2), SPRING);
  const w = useSpring(useMotionValue(0), SPRING);
  const h = useSpring(useMotionValue(0), SPRING);
  const r = useSpring(useMotionValue(20), SPRING);
  const clip = useTransform([x, y, w, h, r], ([X, Y, W, H, R]: number[]) => {
    const rr = Math.max(0, Math.min(R, W / 2, H / 2));
    return `path(evenodd, "M0 0H${vw}V${vh}H0Z M${X + rr} ${Y}H${X + W - rr}A${rr} ${rr} 0 0 1 ${X + W} ${Y + rr}V${Y + H - rr}A${rr} ${rr} 0 0 1 ${X + W - rr} ${Y + H}H${X + rr}A${rr} ${rr} 0 0 1 ${X} ${Y + H - rr}V${Y + rr}A${rr} ${rr} 0 0 1 ${X + rr} ${Y}Z")`;
  });

  const measure = useCallback(() => {
    setVw(window.innerWidth); setVh(window.innerHeight);
    const el = step ? find(step) : null;
    if (!el) { setRect(null); return; }
    const b = el.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
    setRect({ x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: radius + PAD });
  }, [step]);

  // Drive the springs from the measured rect (or close the hole for centred cards).
  useEffect(() => {
    if (rect) { x.set(rect.x); y.set(rect.y); w.set(rect.w); h.set(rect.h); r.set(rect.r); }
    else { x.set(vw / 2); y.set(vh / 2); w.set(0); h.set(0); }
  }, [rect, vw, vh, x, y, w, h, r]);

  // New step: skip missing targets, scroll into view, then measure once settled.
  useLayoutEffect(() => {
    if (!step) { onDone(); return; }
    setSuccess(false);
    haptic(8);
    if (!step.target && !step.selector) { setRect(null); return; }
    const el = find(step);
    if (!el) { setIdx((i) => Math.min(i + 1, steps.length - 1)); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setTimeout(measure, 360);
    return () => clearTimeout(id);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure); };
  }, [measure]);

  const go = useCallback((n: number) => setIdx((i) => Math.max(0, Math.min(steps.length - 1, i + n))), [steps.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone();
      if (e.key === 'ArrowRight' && !step?.action) last ? onDone() : go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, last, onDone, step]);

  // Tap steps: the hole lets the tap through to the real element; when it happens, cheer and move on.
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (step?.action !== 'tap' || !rect) return;
    const el = find(step);
    if (!el) return;
    const onTap = () => {
      setSuccess(true);
      haptic(30);
      advance.current = setTimeout(() => go(1), 1300);
    };
    el.addEventListener('click', onTap, { once: true });
    return () => { el.removeEventListener('click', onTap); clearTimeout(advance.current); };
  }, [step, rect, go]);

  if (!step) return null;

  const hasHole = !!rect;
  const below = !rect || rect.y + rect.h < vh * 0.55;
  const cardTop = rect ? (below ? Math.min(rect.y + rect.h + 16, vh - 260) : undefined) : undefined;
  const cardBottom = rect && !below ? Math.max(16, vh - rect.y + 16) : undefined;
  const cardW = Math.min(360, vw - 32);
  const cardLeft = (vw - cardW) / 2;
  const arrowX = rect ? Math.max(24, Math.min(cardW - 24, rect.x + rect.w / 2 - cardLeft)) : cardW / 2;
  const words = t(`tour.steps.${success ? `${step.key}Done` : step.key}.title`).split(' ');

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (step.action === 'tap' && !success) return;
    if (info.offset.x < -60 || info.velocity.x < -500) (last ? onDone() : go(1));
    else if (info.offset.x > 60 || info.velocity.x > 500) go(-1);
  };

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('tour.label')}>
      {/* Dim + blur everywhere except the hole. The hole also passes taps through. */}
      <motion.div className="tour__veil" style={{ clipPath: clip, WebkitClipPath: clip as unknown as string }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={motionTokens.page} />
      {hasHole && (
        <motion.div className="tour__ring" style={{ left: x, top: y, width: w, height: h, borderRadius: r }}>
          <span className="tour__pulse" />
          {step.action === 'tap' && !success && <span className="tour__tap" aria-hidden="true"><span /><span /></span>}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.key + (success ? '-ok' : '')}
          className={`tour__card glass-card${hasHole ? '' : ' tour__card--center'}`}
          style={hasHole ? { top: cardTop, bottom: cardBottom, left: cardLeft, width: cardW } : { width: Math.min(340, vw - 32) }}
          initial={{ opacity: 0, y: below ? -12 : 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
          exit={{ opacity: 0, scale: 0.97, transition: motionTokens.pageExit }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.35}
          onDragEnd={onDragEnd}
        >
          {hasHole && <span className={`tour__arrow tour__arrow--${below ? 'up' : 'down'}`} style={{ left: arrowX }} aria-hidden="true" />}
          {!hasHole && <div className="tour__hero"><Mascot name={step.mascot} size={150} animated /></div>}
          <div className="tour__head">
            {hasHole && (
              <motion.div className="tour__mascot" initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={motionTokens.pop}>
                <Mascot name={success ? 'milestone-small-win' : step.mascot} size={58} />
              </motion.div>
            )}
            <div className={`tour__text${hasHole ? '' : ' tour__text--center'}`}>
              <h2 className="text-title-m text-primary tour__title" aria-live="polite">
                {words.map((wd, i) => (
                  <motion.span key={`${wd}-${i}`} initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.08 + i * 0.045, duration: 0.3 }}>{wd} </motion.span>
                ))}
              </h2>
              <motion.p className="text-body-s text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {t(`tour.steps.${success ? `${step.key}Done` : step.key}.body`)}
              </motion.p>
            </div>
          </div>
          <div className="tour__foot">
            <div className="tour__dots" aria-label={t('tour.count', { n: idx + 1, total: steps.length })}>
              {steps.map((s, i) => <motion.span key={s.key} className={`tour__dot${i === idx ? ' tour__dot--on' : i < idx ? ' tour__dot--done' : ''}`} layout transition={motionTokens.press} />)}
            </div>
            <div className="tour__actions">
              {!last && <TextButton label={t('tour.skip')} onClick={onDone} />}
              {step.action === 'tap' && !success
                ? <span className="text-mono-caption text-brand tour__hint">{t('tour.tapHint')}</span>
                : <Button label={last ? t('tour.finish') : idx === 0 ? t('tour.start') : t('tour.next')} onClick={() => (last ? onDone() : go(1))} />}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {last && <Confetti count={36} />}
    </div>,
    document.body,
  );
}

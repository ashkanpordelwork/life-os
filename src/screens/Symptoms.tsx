import { motion, useAnimationControls } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { NEED_TAGS, type NeedTag } from '../data/types';
import { t } from '../i18n';
import { MAX_SYMPTOMS, useOnboarding } from '../state/onboarding';
import { TOTAL_STEPS } from './flow';
import './onboarding.css';

/** Symptoms (Figma 55:196). 8 chips, up to 3 can be picked.
 *  The limit is shown, not just told: 3 slots fill as you pick, other chips fade when full,
 *  and a 4th tap shakes the counter (user feedback: people didn't see the limit). */
export function Symptoms() {
  const navigate = useNavigate();
  const { state, toggleSymptom } = useOnboarding();
  const [limitHit, setLimitHit] = useState(false);
  const counter = useAnimationControls();
  const picked = state.symptoms.length;
  const full = picked >= MAX_SYMPTOMS;
  const toggle = (tag: NeedTag) => {
    const adding = !state.symptoms.includes(tag);
    const blocked = adding && full;
    setLimitHit(blocked);
    // A 4th tap: shake the counter so the eye goes to "3 of 3".
    if (blocked) { void counter.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } }); return; }
    toggleSymptom(tag);
  };
  return (
    <Screen>
      <TopBar title={t('symptomsScreen.topTitle')} trailing={t('common.step', { n: 1, total: TOTAL_STEPS })} onBack={() => navigate('/intro')} />
      <SegmentedProgress total={TOTAL_STEPS} filled={1} />
      <h2 className="text-title-l text-primary">{t('symptomsScreen.title')}</h2>
      <p className="text-body-s text-secondary">{t('symptomsScreen.subtitle')}</p>
      {/* Counter: 3 slots that fill as you pick. Plain status, not a button. */}
      <motion.div className="pick-count" animate={counter} role="status" aria-live="polite">
        <span className="pick-count__slots" aria-hidden="true">
          {Array.from({ length: MAX_SYMPTOMS }, (_, i) => (
            <motion.span key={i} className={`pick-count__slot${i < picked ? ' pick-count__slot--on' : ''}`} animate={i === picked - 1 ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.25 }} />
          ))}
        </span>
        <span className={`text-body-s ${limitHit ? 'text-brand' : 'text-secondary'}`}>
          {limitHit ? t('symptomsScreen.limit') : full ? t('symptomsScreen.full') : t('symptomsScreen.count', { n: picked })}
        </span>
      </motion.div>
      <div className="chip-wrap">
        {NEED_TAGS.map((tag) => (
          <Chip key={tag} label={t(`symptoms.${tag}`)} selected={state.symptoms.includes(tag)} muted={full} onToggle={() => toggle(tag)} />
        ))}
      </div>
      <Spacer />
      <p className="text-caption text-secondary text-center">{t('symptomsScreen.next')}</p>
      <Button block label={t('common.continue')} onClick={() => navigate('/question/movement')} />
    </Screen>
  );
}

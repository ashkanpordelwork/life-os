import { motion } from 'motion/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { haptic, motionTokens } from '../styles/motion';
import { AnswerRow } from '../components/AnswerRow';
import { Button } from '../components/Button';
import { IconTile, type Glyph } from '../components/IconTile';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { AREAS, type Area } from '../data/types';
import type { AnswerIndex } from '../engine';
import { t, tList } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { HEALTH_ROUTE, QUESTION_ROUTES, TIMES_ROUTE, TOTAL_STEPS, areaFromSlug } from './flow';
import './onboarding.css';

const GLYPH: Record<Area, Glyph> = { Movement: 'Move', Nutrition: 'Nutrition', Sleep: 'Sleep', Mind: 'Mind' };

/** Questions 1–4 (Figma 55:229 Movement, 55:262 Nutrition, 55:293 Sleep, 55:324 Mind). */
export function Question() {
  const navigate = useNavigate();
  const { area: slug } = useParams();
  const { state, setAnswer } = useOnboarding();
  const area = areaFromSlug(slug);
  if (!area) return <Navigate to="/question/movement" replace />;

  const index = AREAS.indexOf(area);
  // Symptoms is step 1; sleep times sit between Sleep and Mind.
  const step = index + 2 + (index > AREAS.indexOf('Sleep') ? 1 : 0);
  const selected = state.answers[area];
  const back = index === 0 ? '/symptoms' : AREAS[index - 1] === 'Sleep' ? TIMES_ROUTE : QUESTION_ROUTES[AREAS[index - 1]];
  const next = area === 'Sleep' ? TIMES_ROUTE : index === AREAS.length - 1 ? HEALTH_ROUTE : QUESTION_ROUTES[AREAS[index + 1]];

  return (
    <Screen>
      <TopBar title={t(`areas.${area}`)} trailing={t('common.step', { n: step, total: TOTAL_STEPS })} onBack={() => navigate(back)} />
      <SegmentedProgress total={TOTAL_STEPS} filled={step} />
      <IconTile glyph={GLYPH[area]} size="L" />
      <h2 className="text-title-l text-primary">{t(`questions.${area}.question`)}</h2>
      <div className="answer-list" role="radiogroup" aria-label={t(`questions.${area}.question`)}>
        {tList(`questions.${area}.answers`).map((label, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.06 + i * motionTokens.stagger }}>
            <AnswerRow label={label} selected={selected === i} onSelect={() => { haptic(8); setAnswer(area, i as AnswerIndex); }} />
          </motion.div>
        ))}
      </div>
      <Spacer />
      <Button block label={t('common.continue')} disabled={selected === undefined} onClick={() => navigate(next)} />
    </Screen>
  );
}

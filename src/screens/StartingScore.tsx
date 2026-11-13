import { motion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { motionTokens } from '../styles/motion';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { ScoreRow } from '../components/ScoreRow';
import { TopBar } from '../components/TopBar';
import { AREAS, type Area } from '../data/types';
import { areaScoresFromAnswers, overallScore, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { HEALTH_ROUTE, TOTAL_STEPS, firstMissingQuestion } from './flow';

/** Starting score (Figma 55:355) */
export function StartingScore() {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const missing = firstMissingQuestion(state);
  if (missing) return <Navigate to={missing} replace />;

  const scores = areaScoresFromAnswers(state.answers as Record<Area, AnswerIndex>);
  return (
    <Screen>
      <TopBar title={t('score.topTitle')} trailing={t('common.step', { n: TOTAL_STEPS, total: TOTAL_STEPS })} onBack={() => navigate(HEALTH_ROUTE)} />
      <p className="text-display-xl text-primary text-center"><AnimatedNumber value={overallScore(scores)} decimals={1} /></p>
      <p className="text-body-m text-secondary text-center">{t('score.subtitle')}</p>
      <GlassPanel gap={14}>
        {AREAS.map((a, i) => (
          <motion.div key={a} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...motionTokens.page, delay: 0.25 + i * motionTokens.stagger }}>
            <ScoreRow label={t(`areas.${a}`)} score={scores[a]} />
          </motion.div>
        ))}
      </GlassPanel>
      <Spacer />
      <Button block label={t('score.cta')} onClick={() => navigate('/patches')} />
    </Screen>
  );
}

import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { ScoreRow } from '../components/ScoreRow';
import { TopBar } from '../components/TopBar';
import { AREAS, type Area } from '../data/types';
import { areaScoresFromAnswers, overallScore, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { QUESTION_ROUTES, TOTAL_STEPS, firstMissingQuestion } from './flow';

/** Starting score (Figma 55:355) */
export function StartingScore() {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const missing = firstMissingQuestion(state);
  if (missing) return <Navigate to={missing} replace />;

  const scores = areaScoresFromAnswers(state.answers as Record<Area, AnswerIndex>);
  return (
    <Screen>
      <TopBar title={t('score.topTitle')} trailing={t('common.step', { n: TOTAL_STEPS, total: TOTAL_STEPS })} onBack={() => navigate(QUESTION_ROUTES.Mind)} />
      <p className="text-display-xl text-primary text-center">{overallScore(scores).toFixed(1)}</p>
      <p className="text-body-m text-secondary text-center">{t('score.subtitle')}</p>
      <GlassPanel gap={14}>
        {AREAS.map((a) => <ScoreRow key={a} label={t(`areas.${a}`)} score={scores[a]} />)}
      </GlassPanel>
      <Spacer />
      <Button block label={t('score.cta')} onClick={() => navigate('/patches')} />
    </Screen>
  );
}

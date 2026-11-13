import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { IconTile, type Glyph } from '../components/IconTile';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { AREAS, type Area } from '../data/types';
import { areaScoresFromAnswers, overallScore, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import './progress.css';

const GLYPH: Record<Area, Glyph> = { Movement: 'Move', Nutrition: 'Nutrition', Sleep: 'Sleep', Mind: 'Mind' };

/** Score by area (Figma 59:1430). Shows the starting score until a re-check exists. */
export function ScoreByArea() {
  const navigate = useNavigate();
  const { profile } = useSession();
  const answers = profile?.answers ?? {};
  const complete = AREAS.every((a) => answers[a] !== undefined);
  const scores = complete ? areaScoresFromAnswers(answers as Record<Area, AnswerIndex>) : null;

  return (
    <Screen>
      <TopBar title="" trailing={t('progress.scoreLabel')} onBack={() => navigate('/progress')} />
      <p className="text-display-xl text-primary text-center"><AnimatedNumber value={scores ? overallScore(scores) : 0} decimals={1} /></p>
      <p className="text-body-m text-secondary text-center">{t('progress.scoreSubtitle')}</p>
      {AREAS.map((a) => (
        <div key={a} className="score-card glass-card">
          <IconTile glyph={GLYPH[a]} size="M" />
          <div className="score-card__mid">
            <span className="text-mono-label text-secondary">{t(`areas.${a}`)}</span>
            <SegmentedProgress total={5} filled={Math.round(scores?.[a] ?? 0)} />
          </div>
          <span className="text-mono-value text-primary">{(scores?.[a] ?? 0).toFixed(1)}</span>
        </div>
      ))}
      <Spacer />
    </Screen>
  );
}

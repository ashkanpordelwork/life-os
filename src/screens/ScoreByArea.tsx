import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { IconTile, type Glyph } from '../components/IconTile';
import { Screen, Spacer } from '../components/Screen';
import { ScoreDelta } from '../components/ScoreRow';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { AREAS, type Area } from '../data/types';
import { areaScoresFromAnswers, overallScore, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import './progress.css';

const GLYPH: Record<Area, Glyph> = { Movement: 'Move', Nutrition: 'Nutrition', Sleep: 'Sleep', Mind: 'Mind' };

/** Score by area (Figma 59:1430). After a Release check-in it shows the change since the start. */
export function ScoreByArea() {
  const navigate = useNavigate();
  const { profile } = useSession();
  const answers = profile?.answers ?? {};
  const complete = AREAS.every((a) => answers[a] !== undefined);
  const scores = complete ? areaScoresFromAnswers(answers as Record<Area, AnswerIndex>) : null;
  const start = profile?.start_answers;
  const startScores = start && AREAS.every((a) => start[a] !== undefined) ? areaScoresFromAnswers(start as Record<Area, AnswerIndex>) : null;
  const diff = scores && startScores ? overallScore(scores) - overallScore(startScores) : null;
  const subtitle = diff === null ? t('progress.scoreSubtitle')
    : Math.abs(diff) < 0.05 ? t('progress.scoreSubtitleSame')
    : t(diff > 0 ? 'progress.scoreSubtitleNow' : 'progress.scoreSubtitleDown', { x: Math.abs(diff).toFixed(1) });

  return (
    <Screen>
      <TopBar title="" trailing={t('progress.scoreLabel')} onBack={() => navigate('/progress')} />
      <p className="text-display-xl text-primary text-center"><AnimatedNumber value={scores ? overallScore(scores) : 0} decimals={1} /></p>
      <p className={`text-body-m text-center ${diff !== null && diff >= 0.05 ? 'score-up' : 'text-secondary'}`}>{subtitle}</p>
      {AREAS.map((a) => (
        <div key={a} className="score-card glass-card">
          <IconTile glyph={GLYPH[a]} size="M" />
          <div className="score-card__mid">
            <span className="text-mono-label text-secondary">{t(`areas.${a}`)}</span>
            <SegmentedProgress total={5} filled={Math.round(scores?.[a] ?? 0)} />
          </div>
          <span className="score-card__value">
            {scores && startScores && Math.abs(scores[a] - startScores[a]) >= 0.05 && <ScoreDelta delta={scores[a] - startScores[a]} />}
            <span className="text-mono-value text-primary">{(scores?.[a] ?? 0).toFixed(1)}</span>
          </span>
        </div>
      ))}
      <Spacer />
    </Screen>
  );
}

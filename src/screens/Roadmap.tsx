import { motion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { getItem } from '../data';
import { dayKey, sprintDay } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import { pad2 } from './flow';
import { reviewDue } from './Review';
import './progress.css';
import './roadmap.css';

/**
 * Roadmap (Figma 48:109). Past Sprints are Done, the current one shows its day, then Next.
 * Themes (Morning basics, Move more, ...) show when a Sprint has one; theme choice is not built yet,
 * so the current Sprint lists its patches instead.
 */
export function Roadmap() {
  const navigate = useNavigate();
  const { sprint, today } = useSession();
  if (!sprint) return <Navigate to="/today" replace />;

  const day = sprintDay(dayKey(new Date(sprint.started_at)), today, sprint.length_days);
  const currentText = sprint.theme ?? sprint.patch_ids.map((id) => getItem(id)?.title).filter(Boolean).join(' · ');
  const rows = [
    ...Array.from({ length: sprint.number - 1 }, (_, i) => ({ n: i + 1, state: 'done' as const })),
    { n: sprint.number, state: 'now' as const },
    { n: sprint.number + 1, state: 'next' as const },
  ];

  return (
    <Screen>
      <div className="progress__top"><span className="text-mono-label text-secondary">{t('roadmap.label')}</span></div>
      <h1 className="text-title-l text-primary">{t('roadmap.title')}</h1>
      <GlassPanel gap={14}>
        {rows.map((r, i) => (
          <motion.div key={r.n} className="roadmap__row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: i * motionTokens.stagger }}>
            <div className="roadmap__head">
              <span className={`text-mono-label ${r.state === 'now' ? 'text-brand' : 'text-secondary'}`}>{t('roadmap.sprint', { nn: pad2(r.n) })}</span>
              <span className="text-mono-caption text-secondary roadmap__state">
                {r.state === 'done' ? t('roadmap.done') : r.state === 'now' ? t('roadmap.now', { n: day }) : t('roadmap.next')}
              </span>
            </div>
            <p className="text-body-m-strong text-primary">
              {r.state === 'now' ? currentText : r.state === 'done' ? t('roadmap.pastText') : t('roadmap.nextText')}
            </p>
            <SegmentedProgress total={14} filled={r.state === 'done' ? 14 : r.state === 'now' ? day : 0} />
          </motion.div>
        ))}
      </GlassPanel>
      <Spacer />
      {reviewDue(sprint, today) && <Button block label={t('roadmap.plan', { n: sprint.number + 1 })} onClick={() => navigate('/review')} />}
      <AppNav active="roadmap" />
    </Screen>
  );
}

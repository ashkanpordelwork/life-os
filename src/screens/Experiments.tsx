import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { IconTile } from '../components/IconTile';
import { Progress } from '../components/Progress';
import { Screen, Spacer } from '../components/Screen';
import { TextButton } from '../components/TextButton';
import { TopBar } from '../components/TopBar';
import { getItem } from '../data';
import type { ChecklistItem } from '../data/types';
import { METRICS, experimentResult, type Experiment, type Metric } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import './insights.css';

const LENGTHS = [7, 14] as const;

/**
 * Experiments (designed in code, owner decision): test one patch on yourself.
 * Result = average of the chosen check-in metric during the experiment vs the same number of days before.
 */
export function Experiments() {
  const navigate = useNavigate();
  const { sprint, experiments, startExperiment, stopExperiment, checkins, logs, today } = useSession();
  const patches = useMemo(() => (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x), [sprint]);
  const [itemId, setItemId] = useState(patches[0]?.id ?? '');
  const [metric, setMetric] = useState<Metric>('energy');
  const [days, setDays] = useState<number>(7);
  const [busy, setBusy] = useState(false);
  const running = experiments.filter((e) => !experimentResult(e, checkins, logs, today).finished);

  const start = async () => {
    setBusy(true); haptic(20);
    await startExperiment(itemId, metric, days);
    setBusy(false);
  };

  return (
    <Screen>
      <TopBar title={t('experiments.topTitle')} onBack={() => navigate('/progress/insights')} />
      <p className="text-body-s text-secondary">{t('experiments.intro')}</p>

      <AnimatePresence initial={false}>
        {experiments.map((e) => <ExperimentCard key={e.id} e={e} onStop={() => stopExperiment(e.id)} />)}
      </AnimatePresence>
      {experiments.length === 0 && <p className="text-body-s text-secondary">{t('experiments.none')}</p>}

      {running.length === 0 ? (
        <GlassPanel gap={14}>
          <h2 className="text-title-s text-primary">{t('experiments.newTitle')}</h2>
          <span className="text-mono-label text-secondary">{t('experiments.patch')}</span>
          <div className="chip-wrap">{patches.map((p) => <Chip key={p.id} label={p.title} selected={itemId === p.id} onToggle={() => setItemId(p.id)} />)}</div>
          <span className="text-mono-label text-secondary">{t('experiments.metric')}</span>
          <div className="chip-wrap">{METRICS.map((m) => <Chip key={m} label={t(`checkin.short.${m}`)} selected={metric === m} onToggle={() => setMetric(m)} />)}</div>
          <span className="text-mono-label text-secondary">{t('experiments.days')}</span>
          <div className="chip-wrap">{LENGTHS.map((n) => <Chip key={n} label={t('experiments.daysN', { n })} selected={days === n} onToggle={() => setDays(n)} />)}</div>
          <Button block label={t('experiments.start')} busy={busy} disabled={!itemId} onClick={start} />
        </GlassPanel>
      ) : (
        <p className="text-body-s text-secondary">{t('experiments.oneAtATime')}</p>
      )}
      <Spacer />
    </Screen>
  );
}

function ExperimentCard({ e, onStop }: { e: Experiment; onStop: () => void }) {
  const { checkins, logs, today } = useSession();
  const item = getItem(e.item_id);
  const r = experimentResult(e, checkins, logs, today);
  const metric = t(`checkin.short.${e.metric}`).toLowerCase();
  const pct = r.change === null ? 0 : Math.round(Math.abs(r.change) * 100);
  const verdict = r.change === null ? 'wait' : pct < 5 ? 'same' : r.change > 0 ? 'up' : 'down';
  return (
    <motion.div layout className="experiment glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={motionTokens.page}>
      <div className="works__row">
        {item && <IconTile glyph={item.glyph} size="M" />}
        <div className="works__mid">
          <span className="text-mono-label text-brand">{t(r.finished ? 'experiments.finished' : 'experiments.active')} · {t(`checkin.short.${e.metric}`)}</span>
          <span className="text-body-m-strong text-primary">{item?.title ?? e.item_id}</span>
        </div>
        {verdict !== 'wait' && verdict !== 'same' && <span className={`works__delta text-mono-value${verdict === 'up' ? ' works__delta--up' : ''}`}>{verdict === 'up' ? '+' : '−'}{pct}%</span>}
      </div>
      <Progress value={r.elapsed / e.days} label={t('experiments.dayOf', { n: r.elapsed, total: e.days })} />
      <div className="experiment__meta text-mono-caption text-secondary">
        <span>{t('experiments.dayOf', { n: r.elapsed, total: e.days })}</span>
        <span>{t('experiments.doneDays', { n: r.doneDays })}</span>
      </div>
      <p className="text-body-s text-primary">{t(`experiments.result.${verdict}`, { metric, p: pct, days: e.days })}</p>
      <div><TextButton label={r.finished ? t('experiments.remove') : t('experiments.stop')} onClick={onStop} /></div>
    </motion.div>
  );
}

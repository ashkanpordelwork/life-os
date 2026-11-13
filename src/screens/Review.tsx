import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { MetaChip } from '../components/MetaChip';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS, getItem } from '../data';
import { AREAS, type Area, type ChecklistItem, type Sprint } from '../data/types';
import { addDays, areaScoresFromAnswers, dayKey, levelFilter, recommend, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import { formatMinutes, pad2 } from './flow';
import './onboarding.css';
import './review.css';

type Decision = 'keep' | 'swap' | 'drop';
type Step = 'review' | 'suggest' | 'browse' | 'confirm';

/**
 * Release: end-of-Sprint review (Figma Flow 3: 58:696 review, 58:748 suggestions,
 * 58:809 browse, 58:881 confirm). Swap and Drop both free a slot; Drop also hides the
 * patch from this round's suggestions. The new Sprint starts today.
 */
export function Review() {
  const navigate = useNavigate();
  const { sprint, checkins, profile, saveSprint } = useSession();
  const [step, setStep] = useState<Step>('review');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [filter, setFilter] = useState<Area | 'All'>('All');
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x), [sprint]);
  const nextNumber = (sprint?.number ?? 1) + 1;

  const kept = current.filter((i) => (decisions[i.id] ?? 'keep') === 'keep').map((i) => i.id);
  const freed = current.length - kept.length;
  const excluded = new Set(current.map((i) => i.id));

  const pool = useMemo(
    () => levelFilter(ITEMS.filter((i) => i.kind === 'patch' && !excluded.has(i.id)), nextNumber),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sprint, nextNumber],
  );

  const suggestions = useMemo(() => {
    const answers = profile?.answers ?? {};
    const complete = AREAS.every((a) => answers[a] !== undefined);
    if (!complete) return pool.slice(0, 3);
    const scores = areaScoresFromAnswers(answers as Record<Area, AnswerIndex>);
    return recommend({ items: pool, symptoms: profile?.symptoms ?? [], scores, sprintNumber: nextNumber }).map((o) => o.item).slice(0, 3);
  }, [pool, profile, nextNumber]);

  if (!sprint) return <Navigate to="/today" replace />;

  const start = dayKey(new Date(sprint.started_at));
  const end = addDays(start, sprint.length_days - 1);
  const daysDone = (id: string) => new Set(checkins.filter((c) => c.item_id === id && c.day >= start && c.day <= end).map((c) => c.day)).size;

  const togglePick = (id: string) => {
    if (picked.includes(id)) setPicked(picked.filter((x) => x !== id));
    else if (picked.length < freed) setPicked([...picked, id]);
  };

  const confirm = async () => {
    setBusy(true);
    const next: Sprint = {
      number: nextNumber,
      theme: null,
      length_days: 14,
      patch_ids: [...kept, ...picked],
      started_at: new Date().toISOString(),
    };
    await saveSprint(next);
    navigate('/today', { replace: true });
  };

  const back = () => {
    if (step === 'review') navigate('/today');
    else if (step === 'suggest') setStep('review');
    else if (step === 'browse') setStep('suggest');
    else setStep(freed > 0 ? 'suggest' : 'review');
  };

  const pickTrailing = t('review.pickCount', { n: picked.length, total: freed });
  const card = (item: ChecklistItem) => (
    <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={formatMinutes(item.duration_min, t)} done={picked.includes(item.id)} onToggle={() => togglePick(item.id)} disabled={!picked.includes(item.id) && picked.length >= freed} />
  );

  return (
    <Screen>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="review__step"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: motionTokens.page }}
          exit={{ opacity: 0, x: -24, transition: motionTokens.pageExit }}
        >
          {step === 'review' && (
            <>
              <TopBar title={t('review.topTitle', { n: sprint.number })} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.title')}</h2>
              <p className="text-body-s text-secondary">{t('review.subtitle')}</p>
              {current.map((item) => {
                const d = decisions[item.id] ?? 'keep';
                return (
                  <GlassPanel key={item.id} gap={8}>
                    <div className="review__patch">
                      <PatchCard glyph={item.glyph} title={item.title} meta={t('review.daysDone', { n: daysDone(item.id), total: sprint.length_days })} onOpen={() => navigate(`/patch/${item.id}`)} hideCheck />
                    </div>
                    <div className="chip-wrap" role="radiogroup" aria-label={item.title}>
                      {(['keep', 'swap', 'drop'] as Decision[]).map((k) => (
                        <Chip key={k} label={t(`review.${k}`)} selected={d === k} onToggle={() => { setDecisions({ ...decisions, [item.id]: k }); setPicked([]); }} />
                      ))}
                    </div>
                  </GlassPanel>
                );
              })}
              <Spacer />
              <Button block label={t(freed > 0 ? 'review.seeSuggestions' : 'review.continue')} onClick={() => setStep(freed > 0 ? 'suggest' : 'confirm')} />
            </>
          )}

          {step === 'suggest' && (
            <>
              <TopBar title={t('review.nextTitle', { n: nextNumber })} trailing={pickTrailing} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.suggestTitle')}</h2>
              <p className="text-body-s text-secondary">{t('review.suggestSubtitle', { n: sprint.number })}</p>
              {suggestions.length ? suggestions.map(card) : <p className="text-body-s text-secondary">{t('review.empty')}</p>}
              <Spacer />
              <Button block label={t('review.confirmPick')} disabled={picked.length !== freed} onClick={() => setStep('confirm')} />
              <Button block variant="Ghost" label={t('review.browse')} onClick={() => setStep('browse')} />
            </>
          )}

          {step === 'browse' && (
            <>
              <TopBar title={t('review.browseTitle')} trailing={pickTrailing} onBack={back} />
              <div className="chip-wrap">
                {(['All', ...AREAS] as const).map((a) => (
                  <Chip key={a} label={a === 'All' ? t('review.all') : t(`review.areas.${a}`)} selected={filter === a} onToggle={() => setFilter(a)} />
                ))}
              </div>
              {pool.filter((i) => filter === 'All' || i.area === filter).map(card)}
              <Spacer />
              <Button block label={t('review.confirmPick')} disabled={picked.length !== freed} onClick={() => setStep('confirm')} />
            </>
          )}

          {step === 'confirm' && (
            <>
              <TopBar title={t('review.nextTitle', { n: nextNumber })} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.readyTitle')}</h2>
              {[...kept, ...picked].map(getItem).filter((x): x is ChecklistItem => !!x).map((item) => (
                <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={formatMinutes(item.duration_min, t)} done />
              ))}
              <GlassPanel>
                <div><MetaChip icon="calendar_today" label={t('review.startsToday')} /></div>
              </GlassPanel>
              <Spacer />
              <Button block label={t('review.confirm', { n: nextNumber })} busy={busy} onClick={confirm} />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
}

/** Today shows the review button from the last day of the Sprint on. */
export function reviewDue(sprint: Sprint | null, today: string): boolean {
  if (!sprint) return false;
  const start = dayKey(new Date(sprint.started_at));
  return today >= addDays(start, sprint.length_days - 1);
}

export const reviewLabel = (sprint: Sprint) => t('review.cta', { nn: pad2(sprint.number) });

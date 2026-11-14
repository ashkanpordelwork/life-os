import { AnimatePresence, motion } from 'motion/react';
import { AnswerRow } from '../components/AnswerRow';
import { IconTile, type Glyph } from '../components/IconTile';
import { ScoreRow } from '../components/ScoreRow';
import { SegmentedProgress } from '../components/SegmentedProgress';
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
import { flagsFromHealth, SAFETY_RULES } from '../data/safetyRules';
import { AREAS, SPRINT_DAYS, type Area, type ChecklistItem, type Sprint } from '../data/types';
import {
  LEVEL_UP_COMPLETION, addDays, allowedLevels, areaScoresFromAnswers, dayKey, levelFilter, overallScore, recommend,
  sprintCompletion, themeFor, type AnswerIndex,
} from '../engine';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { canStartSprint, hasPro } from '../state/plan';
import { useActiveProgram } from '../state/program';
import { getProgram } from '../data/programs';
import { Mascot } from '../components/Mascot';
import { MAX_PATCHES, MIN_PATCHES } from '../state/onboarding';
import { motionTokens } from '../styles/motion';
import { itemAmount, pad2 } from './flow';
import './onboarding.css';
import './review.css';

/** Week names are a list in en.json: programs.list.<id>.weeks[i]. */
const weekName = (id: string, i: number) => tList(`programs.list.${id}.weeks`)[i] ?? '';

type Decision = 'keep' | 'swap' | 'drop';
type Step = 'assess' | 'scores' | 'locked' | 'review' | 'suggest' | 'browse' | 'confirm';
type Answers = Partial<Record<Area, AnswerIndex>>;

const GLYPH: Record<Area, Glyph> = { Movement: 'Move', Nutrition: 'Nutrition', Sleep: 'Sleep', Mind: 'Mind' };
const full = (a: Answers | undefined): a is Record<Area, AnswerIndex> => !!a && AREAS.every((k) => a[k] !== undefined);

/**
 * Release: end-of-Sprint review (Figma Flow 3: 58:696 review, 58:748 suggestions,
 * 58:809 browse, 58:881 confirm). Swap and Drop both free a slot; Drop also hides the
 * patch from this round's suggestions. The new Sprint starts today.
 * Owner decisions (added in code): Release starts by asking the 4 questions again, then shows
 * the score with the change since the start. Level 2 opens when 70% of the Sprint's days had a patch done.
 */
export function Review() {
  const navigate = useNavigate();
  const session = useSession();
  const { checkins, profile, saveSprint, updateProfile, today, plan } = session;
  // Keep the Sprint being released fixed while this screen is open: saving the new one
  // must not change the lists on screen before we leave.
  const [sprint] = useState(session.sprint);
  const [step, setStep] = useState<Step>('assess');
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [filter, setFilter] = useState<Area | 'All'>('All');
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x), [sprint]);
  const nextNumber = (sprint?.number ?? 1) + 1;

  const kept = current.filter((i) => (decisions[i.id] ?? 'keep') === 'keep').map((i) => i.id);
  const freed = current.length - kept.length;
  // Owner decision: a Sprint has 3 to 5 patches. Swap/Drop free slots; there may be room to add more.
  const minPick = Math.max(0, MIN_PATCHES - kept.length);
  const maxPick = Math.max(0, MAX_PATCHES - kept.length);
  const pickOk = picked.length >= minPick && picked.length <= maxPick && (freed > 0 || picked.length > 0);
  const excluded = new Set(current.map((i) => i.id));

  const completion = sprint ? sprintCompletion(sprint, checkins, today) : 0;
  const levelCtx = { prevCompletion: completion, l2Open: current.some((i) => i.level >= 2), pro: hasPro(plan) };
  // Free plan (only when the Pro lock is on): no new Sprint after the first; the same patches go on.
  const locked = !canStartSprint(plan, (sprint?.number ?? 1) + 1);
  const l2Now = allowedLevels(nextNumber, levelCtx).includes(2);
  const l2Before = allowedLevels(sprint?.number ?? 1, { l2Open: levelCtx.l2Open }).includes(2) || levelCtx.l2Open;

  const pool = useMemo(
    () => levelFilter(
      ITEMS.filter((i) => i.kind === 'patch' && !excluded.has(i.id))
        // Browse also respects safety (e.g. no hard cardio with a health risk).
        .filter((i) => !SAFETY_RULES.some((r) => r.blocks(i, { symptoms: profile?.symptoms ?? [], flags: flagsFromHealth(profile?.health) }))),
      nextNumber, levelCtx,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sprint, nextNumber, completion],
  );

  // Scores: now (just answered), and at the start (onboarding answers; older accounts: last saved answers).
  const startAnswers = profile?.start_answers ?? profile?.answers;
  const nowScores = full(answers) ? areaScoresFromAnswers(answers) : null;
  const startScores = full(startAnswers) ? areaScoresFromAnswers(startAnswers) : null;

  const suggestions = useMemo(() => {
    const scores = nowScores ?? startScores;
    if (!scores) return pool.slice(0, 3);
    return recommend({ items: pool, symptoms: profile?.symptoms ?? [], scores, sprintNumber: nextNumber, levels: levelCtx, flags: flagsFromHealth(profile?.health), count: 6 }).map((o) => o.item).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, profile, nextNumber, answers]);

  if (!sprint) return <Navigate to="/today" replace />;

  const start = dayKey(new Date(sprint.started_at));
  const end = addDays(start, sprint.length_days - 1);
  const daysDone = (id: string) => new Set(checkins.filter((c) => c.item_id === id && c.day >= start && c.day <= end).map((c) => c.day)).size;

  const togglePick = (id: string) => {
    if (picked.includes(id)) setPicked(picked.filter((x) => x !== id));
    else if (picked.length < maxPick) setPicked([...picked, id]);
  };

  // Free plan: same patches, same Sprint number, a fresh 7 days. New answers are still saved.
  const keepGoing = async () => {
    setBusy(true);
    if (profile && full(answers)) await updateProfile({ answers, start_answers: profile.start_answers ?? profile.answers });
    await saveSprint({ ...sprint!, length_days: SPRINT_DAYS, started_at: new Date().toISOString() });
    navigate('/today', { replace: true });
  };

  // Programs: offer the next week as the next Sprint.
  const [program, setProgram] = useActiveProgram(session.user?.id);
  const prog = program ? getProgram(program.id) : undefined;
  const progNextWeek = prog && program && program.week < prog.weeks.length ? program.week + 1 : null;
  const startProgramWeek = async () => {
    if (!prog || !progNextWeek || !sprint) return;
    setBusy(true);
    const ids = prog.weeks[progNextWeek - 1].patch_ids;
    if (profile && full(answers)) await updateProfile({ answers, start_answers: profile.start_answers ?? profile.answers });
    await saveSprint({ number: nextNumber, theme: themeFor(ids.map(getItem).filter((x): x is ChecklistItem => !!x)), length_days: SPRINT_DAYS, patch_ids: ids, started_at: new Date().toISOString() });
    setProgram({ id: prog.id, week: progNextWeek, sprint: nextNumber });
    navigate('/today', { replace: true });
  };

  const confirm = async () => {
    setBusy(true);
    const ids = [...kept, ...picked];
    const next: Sprint = {
      number: nextNumber,
      theme: themeFor(ids.map(getItem).filter((x): x is ChecklistItem => !!x)),
      length_days: SPRINT_DAYS,
      patch_ids: ids,
      started_at: new Date().toISOString(),
    };
    if (profile && full(answers)) await updateProfile({ answers, start_answers: profile.start_answers ?? profile.answers });
    await saveSprint(next);
    navigate('/today', { replace: true });
  };

  const back = () => {
    if (step === 'assess') { if (qi === 0) navigate('/today'); else setQi(qi - 1); }
    else if (step === 'scores') { setStep('assess'); setQi(AREAS.length - 1); }
    else if (step === 'review') setStep('scores');
    else if (step === 'suggest') setStep('review');
    else if (step === 'browse') setStep('suggest');
    else setStep(freed > 0 || picked.length > 0 ? 'suggest' : 'review');
  };

  const pickTrailing = t('review.pickCount', { n: picked.length, total: maxPick });
  const card = (item: ChecklistItem) => (
    <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={itemAmount(item, t)} done={picked.includes(item.id)} onToggle={() => togglePick(item.id)} disabled={!picked.includes(item.id) && picked.length >= maxPick} />
  );

  return (
    <Screen>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step === 'assess' ? `assess-${qi}` : step}
          className="review__step"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: motionTokens.page }}
          exit={{ opacity: 0, x: -24, transition: motionTokens.pageExit }}
        >
          {step === 'assess' && (() => {
            const area = AREAS[qi];
            const q = t(`questions.${area}.question`);
            return (
              <>
                <TopBar title={t('review.checkTitle')} trailing={t('common.step', { n: qi + 1, total: AREAS.length })} onBack={back} />
                <SegmentedProgress total={AREAS.length} filled={qi + 1} />
                <IconTile glyph={GLYPH[area]} size="L" />
                <h2 className="text-title-l text-primary">{q}</h2>
                <div className="answer-list" role="radiogroup" aria-label={q}>
                  {tList(`questions.${area}.answers`).map((label, i) => (
                    <AnswerRow key={label} label={label} selected={answers[area] === i} onSelect={() => setAnswers({ ...answers, [area]: i as AnswerIndex })} />
                  ))}
                </div>
                <Spacer />
                <Button block label={t('common.continue')} disabled={answers[area] === undefined} onClick={() => (qi < AREAS.length - 1 ? setQi(qi + 1) : setStep('scores'))} />
              </>
            );
          })()}

          {step === 'scores' && nowScores && (() => {
            const now = overallScore(nowScores);
            const diff = startScores ? now - overallScore(startScores) : 0;
            const line = !startScores || Math.abs(diff) < 0.05
              ? t('review.scoreSame')
              : t(diff > 0 ? 'review.scoreUp' : 'review.scoreDown', { x: Math.abs(diff).toFixed(1) });
            return (
              <>
                <TopBar title={t('review.scoreTitle')} onBack={back} />
                <p className="text-display-xl text-primary text-center">{now.toFixed(1)}</p>
                <p className={`text-body-m text-center ${diff > 0.05 ? 'review__up' : 'text-secondary'}`}>{line}</p>
                <GlassPanel gap={14}>
                  {AREAS.map((a) => (
                    <ScoreRow key={a} label={t(`areas.${a}`)} score={nowScores[a]} delta={startScores ? nowScores[a] - startScores[a] : undefined} />
                  ))}
                </GlassPanel>
                <Spacer />
                <Button block label={t('common.continue')} onClick={() => setStep(locked ? 'locked' : 'review')} />
              </>
            );
          })()}

          {step === 'locked' && (
            <>
              <TopBar title={t('review.topTitle', { n: sprint.number })} onBack={() => setStep('scores')} />
              <div className="hero"><Mascot name="milestone-release-shipped" size={200} animated /></div>
              <h2 className="text-title-l text-primary text-center">{t('review.lockedTitle', { n: sprint.number })}</h2>
              <p className="text-body-m text-secondary text-center">{t('review.lockedBody', { n: nextNumber })}</p>
              <Spacer />
              <Button block label={t('review.keepGoing')} busy={busy} onClick={keepGoing} />
              <Button block variant="Ghost" label={t('review.seePro')} onClick={() => navigate('/pro')} />
            </>
          )}

          {step === 'review' && (
            <>
              <TopBar title={t('review.topTitle', { n: sprint.number })} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.title')}</h2>
              {prog && progNextWeek && (
                <section className="review__program">
                  <span className="text-mono-label">{t('programs.nextTitle', { program: t(`programs.list.${prog.id}.title`) })}</span>
                  <span className="text-body-m">{t('programs.nextBody', { n: progNextWeek, name: weekName(prog.id, progNextWeek - 1) })}</span>
                  <span className="text-body-s review__program-patches">{prog.weeks[progNextWeek - 1].patch_ids.map((id) => getItem(id)?.title).join(' · ')}</span>
                  <Button block variant="Secondary" label={t('programs.nextCta', { n: progNextWeek })} busy={busy} onClick={startProgramWeek} />
                </section>
              )}
              {prog && program && !progNextWeek && (
                <GlassPanel gap={8}>
                  <span className="text-title-s text-primary">{t('programs.doneTitle')}</span>
                  <span className="text-body-s text-secondary">{t('programs.doneBody', { program: t(`programs.list.${prog.id}.title`) })}</span>
                </GlassPanel>
              )}
              <p className="text-body-s text-secondary">{t('review.subtitle')}</p>
              {current.map((item) => {
                const d = decisions[item.id] ?? 'keep';
                return (
                  <GlassPanel key={item.id} gap={8}>
                    <div className="review__patch">
                      <PatchCard glyph={item.glyph} title={item.title} meta={t('review.daysDone', { n: daysDone(item.id), total: item.per_week ? Math.ceil(sprint.length_days / 7) * item.per_week : sprint.length_days })} onOpen={() => navigate(`/patch/${item.id}`)} hideCheck />
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
              {freed === 0 && kept.length < MAX_PATCHES && (
                <Button block variant="Ghost" label={t('review.addPatch')} onClick={() => setStep('suggest')} />
              )}
            </>
          )}

          {step === 'suggest' && (
            <>
              <TopBar title={t('review.nextTitle', { n: nextNumber })} trailing={pickTrailing} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.suggestTitle')}</h2>
              <p className="text-body-s text-secondary">{t('review.suggestSubtitle', { n: sprint.number })}</p>
              {nextNumber >= 3 && !l2Before && (
                <GlassPanel>
                  <div className="review__level">
                    <MetaChip icon={l2Now ? 'trending_up' : 'lock'} label={t(l2Now ? 'review.levelUp' : 'review.levelLocked')} />
                    <span className="text-body-s text-secondary">
                      {t(l2Now ? 'review.levelUpBody' : 'review.levelLockedBody', { p: Math.round(completion * 100), need: Math.round(LEVEL_UP_COMPLETION * 100) })}
                    </span>
                  </div>
                </GlassPanel>
              )}
              {suggestions.length ? suggestions.map(card) : <p className="text-body-s text-secondary">{t('review.empty')}</p>}
              <Spacer />
              <Button block label={t('review.confirmPick')} disabled={!pickOk} onClick={() => setStep('confirm')} />
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
              <Button block label={t('review.confirmPick')} disabled={!pickOk} onClick={() => setStep('confirm')} />
            </>
          )}

          {step === 'confirm' && (
            <>
              <TopBar title={t('review.nextTitle', { n: nextNumber })} onBack={back} />
              <h2 className="text-title-l text-primary">{t('review.readyTitle')}</h2>
              {[...kept, ...picked].map(getItem).filter((x): x is ChecklistItem => !!x).map((item) => (
                <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={itemAmount(item, t)} done />
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

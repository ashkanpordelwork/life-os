import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../components/Icon';
import { TextButton } from '../components/TextButton';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { IconButton } from '../components/IconButton';
import { MetaChip } from '../components/MetaChip';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { SprintStrip } from '../components/SprintStrip';
import { StatChip } from '../components/StatChip';
import { getItem } from '../data';
import type { Area } from '../data/types';
import { REST_ID, areaScoresFromAnswers, canRestToday, currentStreak, overallScore, sprintDay, totalActiveDays, dayKey, dayOrder, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import { reviewDue, reviewLabel } from './Review';
import { pad2, patchMeta, sprintTheme } from './flow';
import './today.css';

const TINY_KEY = 'lifeos.tinyMode';
const NUDGE_KEY = 'lifeos.nudge.dismissed';

function greeting(name: string, firstDay: boolean): string {
  const n = name.trim().split(' ')[0];
  if (firstDay) return n ? t('today.hi', { name: n }) : t('today.hiNoName');
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return n ? t(`today.${part}`, { name: n }) : t(`today.${part}NoName`);
}

/** Today (Figma 2034:3528 day 1, 2033:2883 in progress, 2033:3011 all done) */
export function Today() {
  const navigate = useNavigate();
  const { profile, sprint, checkins, today, setDone, setRest, reminders, wake, bed } = useSession();
  const [nudgeHidden, setNudgeHidden] = useState(() => { try { return localStorage.getItem(NUDGE_KEY) === dayKey(new Date()); } catch { return false; } });
  const [sheet, setSheet] = useState<'busy' | 'rest' | null>(null);
  const [tiny, setTiny] = useState(() => { try { return localStorage.getItem(TINY_KEY) === '1'; } catch { return false; } });

  const stats = useMemo(() => {
    const answers = profile?.answers ?? {};
    const complete = (['Movement', 'Nutrition', 'Sleep', 'Mind'] as Area[]).every((a) => answers[a] !== undefined);
    return {
      streak: currentStreak(checkins, today),
      days: totalActiveDays(checkins),
      score: complete ? overallScore(areaScoresFromAnswers(answers as Record<Area, AnswerIndex>)) : 0,
    };
  }, [checkins, profile, today]);

  if (!sprint) return <Navigate to="/symptoms" replace />;

  const startDay = dayKey(new Date(sprint.started_at));
  const day = sprintDay(startDay, today, sprint.length_days);
  const doneToday = new Set(checkins.filter((c) => c.day === today).map((c) => c.item_id));
  // In the order of the user's day (wake and bed time).
  const items = sprint.patch_ids.map(getItem).filter((x) => x !== undefined).sort((a, b) => dayOrder(a, wake, bed) - dayOrder(b, wake, bed));
  const theme = sprintTheme(sprint);
  const doneCount = items.filter((i) => doneToday.has(i.id)).length;
  const allDone = items.length > 0 && doneCount === items.length;
  const firstDay = day === 1 && !checkins.some((c) => c.item_id !== REST_ID);
  const resting = checkins.some((c) => c.day === today && c.item_id === REST_ID);
  const restAllowed = canRestToday(checkins, today) && doneCount === 0;

  const saveTiny = (on: boolean) => {
    setTiny(on);
    try { localStorage.setItem(TINY_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  };
  // In-app reminder: after the reminder time, if patches are left and today is not a rest day.
  const [rh, rm] = reminders.remind_at.split(':').map(Number);
  const now = new Date();
  const left = items.filter((i) => !doneToday.has(i.id));
  const leftMin = Math.max(1, Math.round(left.reduce((sum, i) => sum + (tiny ? 0.3 : i.duration_min), 0)));
  const showNudge = reminders.inapp_enabled && !nudgeHidden && !resting && left.length > 0 && now.getHours() * 60 + now.getMinutes() >= rh * 60 + rm;
  const hideNudge = () => { setNudgeHidden(true); try { localStorage.setItem(NUDGE_KEY, today); } catch { /* ignore */ } };

  // Tiny mode off -> ask first (Busy day sheet). On -> one tap turns it off.
  const onTinyChip = () => (tiny ? saveTiny(false) : setSheet('busy'));

  const tick = async (id: string) => {
    const done = !doneToday.has(id);
    if (done) haptic();
    await setDone(id, done, tiny ? 'tiny' : 'standard');
    if (done && doneCount + 1 === items.length) setTimeout(() => navigate('/done'), 650);
  };

  return (
    <Screen>
      <header className="today__header">
        <div className="today__greeting">
          <p className="text-mono-label text-primary">{t('today.label', { nn: pad2(sprint.number), dd: pad2(day) })}</p>
          <h1 className="text-title-l text-primary">{greeting(profile?.name ?? '', firstDay)}</h1>
        </div>
        <IconButton icon="notifications" label={t('today.notifications')} onClick={() => navigate('/reminders')} />
      </header>

      <div className="today__stats">
        <StatChip fill icon="local_fire_department" value={<AnimatedNumber value={stats.streak} />} label={t('today.streak')} />
        <StatChip fill icon="calendar_today" value={<AnimatedNumber value={stats.days} />} label={t('today.days')} />
        <StatChip fill icon="insights" value={<AnimatedNumber value={stats.score} decimals={1} />} label={t('today.score')} />
      </div>

      <AnimatePresence initial={false}>
        {showNudge && (
          <motion.div key="nudge" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={motionTokens.page} style={{ overflow: 'hidden' }}>
            <div className="today__nudge glass-card" role="status">
              <span className="today__nudge-icon"><Icon name="notifications" size={20} /></span>
              <span className="text-body-s text-primary today__nudge-text">
                {left.length === 1 ? t('nudge.one', { m: leftMin }) : t('nudge.text', { n: left.length, m: leftMin })}
              </span>
              <TextButton label={t('nudge.later')} onClick={hideNudge} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="today__section">
        <h2 className="text-title-m text-primary">{t('today.section')}</h2>
        <div className="today__progress">
          <SegmentedProgress variant="today" total={items.length} filled={doneCount} />
          <span className="text-mono-caption text-primary">{resting ? t('today.resting') : `${doneCount}/${items.length}`}</span>
        </div>
      </div>

      {items.map((item, i) => (
        <motion.div key={item.id} className="today__card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.08 + i * motionTokens.stagger }}>
          <PatchCard
            glyph={item.glyph}
            title={item.title}
            meta={patchMeta(item, wake, bed, tiny, t)}
            done={doneToday.has(item.id)}
            dimmed={resting}
            onOpen={() => navigate(`/patch/${item.id}`)}
            onToggle={() => tick(item.id)}
            checkLabel={t('today.markDone', { title: item.title })}
          />
        </motion.div>
      ))}

      <SprintStrip label={theme ? `Sprint ${pad2(sprint.number)} · ${theme}` : `Sprint ${pad2(sprint.number)}`} day={day} length={sprint.length_days} />
      {reviewDue(sprint, today) && <Button block label={reviewLabel(sprint)} onClick={() => navigate('/review')} />}

      <div className="today__chip">
        {allDone ? (
          <MetaChip icon="task_alt" label={t('today.allDone')} />
        ) : resting ? (
          <MetaChip icon="verified_user" label={t('today.restOn')} />
        ) : (
          <>
            <MetaChip icon="bolt" label={t(tiny ? 'today.tinyOn' : 'today.tiny')} onClick={onTinyChip} pressed={tiny} />
            {restAllowed && <MetaChip icon="bedtime" label={t('today.rest')} onClick={() => setSheet('rest')} />}
          </>
        )}
      </div>

      <BottomSheet open={sheet === 'busy'} onClose={() => setSheet(null)} title={t('today.busyTitle')} decoration={<Mascot name="rest-busy-day" size={136} />}>
        <p className="text-body-m text-primary">{t('today.busyBody')}</p>
        <ul className="today__tiny-list">
          {items.map((i) => <li key={i.id} className="text-body-s text-primary">{i.tiny_version}</li>)}
        </ul>
        <Button block label={t('today.busyUse')} onClick={() => { saveTiny(true); setSheet(null); }} />
        <Button block variant="Ghost" label={t('today.busyKeep')} onClick={() => setSheet(null)} />
      </BottomSheet>

      <BottomSheet open={sheet === 'rest'} onClose={() => setSheet(null)} title={t('today.restTitle')}>
        <p className="text-body-m text-primary">{t('today.restBody')}</p>
        <Button block label={t('today.restLog')} onClick={async () => { setSheet(null); await setRest(true); }} />
        <Button block variant="Ghost" label={t('today.restCancel')} onClick={() => setSheet(null)} />
      </BottomSheet>

      <Spacer />
      <AppNav active="today" />
    </Screen>
  );
}

import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../components/Icon';
import { TextButton } from '../components/TextButton';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { WeekStat } from '../components/WeekStat';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { IconButton } from '../components/IconButton';
import { MetaChip } from '../components/MetaChip';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { StatChip } from '../components/StatChip';
import { getItem } from '../data';
import type { ChecklistItem } from '../data/types';
import { REST_ID, canRestToday, currentStreak, sprintDay, totalActiveDays, dayKey, dayOrder, capMinutes, weekDays, weekPercent, goalProgress, goalValue } from '../engine';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import { openLibrary } from './Library';
import { reviewDue, reviewLabel } from './Review';
import { formatOf, itemAmount, patchMeta, sprintTheme } from './flow';
import './today.css';
import { ProBanner } from '../components/ProBanner';
import { Collapse } from '../components/Collapse';
import { CoachTeaser } from '../components/CoachTeaser';
import { MODE_ICON, ModeBanner, ModePicker } from '../components/LifeModes';
import { GuidedTour, type TourStep } from '../components/GuidedTour';

const TOUR_STEPS: TourStep[] = [
  { key: 'intro', mascot: 'core-welcome' },
  { key: 'patches', target: 'patches', mascot: 'core-pointing' },
  { key: 'check', selector: '[data-tour="patches"] .patch-card__check', action: 'tap', mascot: 'core-pointing' },
  { key: 'tiny', target: 'tiny', mascot: 'rest-busy-day' },
  { key: 'tools', target: 'tools', mascot: 'morning-breathing' },
  { key: 'roadmap', target: 'roadmap', mascot: 'core-curious' },
  { key: 'progress', target: 'progress', mascot: 'milestone-small-win' },
  { key: 'tribe', target: 'tribe', mascot: 'milestone-welcome-back' },
  { key: 'finale', mascot: 'milestone-all-done' },
];
const tourKey = (uid: string) => `lifeos.tour.v1.${uid}`;

const WELCOME_KEY = 'lifeos.proWelcome';

const TINY_KEY = 'lifeos.tinyMode';
const NUDGE_KEY = 'lifeos.nudge.dismissed';

/** Today (Figma 2034:3528 day 1, 2033:2883 in progress, 2033:3011 all done) */
export function Today() {
  const navigate = useNavigate();
  const { sprint, checkins, today, setDone, setRest, reminders, wake, bed, plan, lifeMode, startMode, endMode } = useSession();
  // Founding members see a one-time thank-you sheet.
  const { message, dismissMessage, user, goals, proRequest, refreshPro } = useSession();
  // "You're Pro now" once, after an admin approved this user's request.
  const approvedId = proRequest?.status === 'approved' && plan === 'pro' ? proRequest.id : null;
  const [seenWelcome, setSeenWelcome] = useState(() => { try { return localStorage.getItem(WELCOME_KEY) ?? ''; } catch { return ''; } });
  const welcome = !!approvedId && seenWelcome !== approvedId;
  // Waiting for an answer: check again when the app comes back to the front.
  useEffect(() => {
    if (proRequest?.status !== 'pending') return;
    void refreshPro();
    const onShow = () => { if (document.visibilityState === 'visible') void refreshPro(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proRequest?.status]);
  // The tour: once per account on this device, or when replayed from You (location state).
  const location = useLocation();
  const replay = !!(location.state as { tour?: boolean } | null)?.tour;
  const [tourOn, setTourOn] = useState(() => {
    try { return replay || (!!user && localStorage.getItem(tourKey(user.id)) !== '1'); } catch { return replay; }
  });
  const endTour = useCallback(() => {
    setTourOn(false);
    try { if (user) localStorage.setItem(tourKey(user.id), '1'); } catch { /* ignore */ }
  }, [user]);
  const closeWelcome = () => { if (!approvedId) return; setSeenWelcome(approvedId); try { localStorage.setItem(WELCOME_KEY, approvedId); } catch { /* ignore */ } };
  const [nudgeHidden, setNudgeHidden] = useState(() => { try { return localStorage.getItem(NUDGE_KEY) === dayKey(new Date()); } catch { return false; } });
  const [sheet, setSheet] = useState<'busy' | 'rest' | 'mode' | 'coach' | null>(null);
  const [tinyPref, setTiny] = useState(() => { try { return localStorage.getItem(TINY_KEY) === '1'; } catch { return false; } });
  const tiny = tinyPref || lifeMode?.mode === 'deadline';

  const stats = useMemo(() => {
    return {
      streak: currentStreak(checkins, today),
      days: totalActiveDays(checkins),
      week: sprint ? weekPercent(sprint, checkins, today, (id) => getItem(id)?.per_week) : { done: 0, target: 0, percent: 0 },
    };
  }, [checkins, sprint, today]);

  if (!sprint) return <Navigate to="/symptoms" replace />;

  const startDay = dayKey(new Date(sprint.started_at));
  const day = sprintDay(startDay, today, sprint.length_days);
  const doneToday = new Set(checkins.filter((c) => c.day === today).map((c) => c.item_id));
  // In the order of the user's day (wake and bed time).
  // Life modes: deadline week forces tiny versions; sick mode sets movement and hard patches aside.
  const deadline = lifeMode?.mode === 'deadline';
  const sick = lifeMode?.mode === 'sick';
  const items = sprint.patch_ids.map(getItem).filter((x) => x !== undefined)
    .filter((i) => !(sick && (i.area === 'Movement' || i.safety_rules.includes('health_lock'))))
    .sort((a, b) => dayOrder(a, wake, bed) - dayOrder(b, wake, bed));
  const theme = sprintTheme(sprint);
  // Weekly patches (e.g. strength 3× a week) are optional on any given day: they show their week count
  // and only count toward today's progress on the days they are done.
  const week = weekDays(today);
  const weekCount = (id: string) => new Set(checkins.filter((c) => c.item_id === id && week.includes(c.day)).map((c) => c.day)).size;
  const daily = items.filter((i) => !i.per_week);
  const dailyList = daily.length ? daily : items;
  const doneCount = dailyList.filter((i) => doneToday.has(i.id)).length;
  const allDone = dailyList.length > 0 && doneCount === dailyList.length;
  // Sick days are paused for the streak, but gentle patches stay doable (not dimmed).
  const resting = !sick && checkins.some((c) => c.day === today && c.item_id === REST_ID);
  const restAllowed = canRestToday(checkins, today) && doneCount === 0;

  const saveTiny = (on: boolean) => {
    setTiny(on);
    try { localStorage.setItem(TINY_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  };
  // In-app reminder: after the reminder time, if patches are left and today is not a rest day.
  const [rh, rm] = reminders.remind_at.split(':').map(Number);
  const now = new Date();
  const left = dailyList.filter((i) => !doneToday.has(i.id));
  const leftMin = Math.max(1, Math.round(left.reduce((sum, i) => sum + (tiny ? 0.3 : capMinutes(i)), 0)));
  const showNudge = reminders.inapp_enabled && !nudgeHidden && !resting && left.length > 0 && now.getHours() * 60 + now.getMinutes() >= rh * 60 + rm;
  const hideNudge = () => { setNudgeHidden(true); try { localStorage.setItem(NUDGE_KEY, today); } catch { /* ignore */ } };

  // Tiny mode off -> ask first (Busy day sheet). On -> one tap turns it off.
  const onTinyChip = () => (tiny ? saveTiny(false) : setSheet('busy'));

  /** Share of today's goal for habits with a number (steps, water). A plain tick is full. */
  const shareOf = (item: ChecklistItem) => {
    const c = checkins.find((x) => x.day === today && x.item_id === item.id);
    if (!c) return 0;
    return item.goal ? goalProgress(c.amount, goalValue(item.goal, goals[item.id])) : 1;
  };
  const partialMeta = (item: ChecklistItem) => {
    const c = checkins.find((x) => x.day === today && x.item_id === item.id);
    if (!item.goal || c?.amount === undefined) return null;
    const target = goalValue(item.goal, goals[item.id]);
    return c.amount < target ? formatOf(c.amount, target, item.goal.unit, t) : null;
  };

  const tick = async (id: string) => {
    const item = getItem(id);
    // Partly done (e.g. 3,000 of 7,000 steps): the circle fills it up to the goal.
    if (item?.goal && doneToday.has(id) && shareOf(item) < 1) {
      haptic();
      await setDone(id, true, tiny ? 'tiny' : 'standard', goalValue(item.goal, goals[id]));
      return;
    }
    const done = !doneToday.has(id);
    if (done) haptic();
    await setDone(id, done, tiny ? 'tiny' : 'standard');
    if (done && dailyList.some((i) => i.id === id) && doneCount + 1 === dailyList.length) setTimeout(() => navigate('/done'), 650);
  };

  return (
    <Screen>
      {tourOn && <GuidedTour steps={TOUR_STEPS} onDone={endTour} />}
      <ProBanner plan={plan} pending={proRequest?.status === 'pending'} onOpen={() => navigate('/pro')} />
      {lifeMode && <ModeBanner mode={lifeMode} onEnd={endMode} onJetLag={() => navigate('/tool/jet-lag')} />}
      <header className="today__header">
        {/* Owner decision: no greeting. The week sits here instead (plain text + bar, not a card). */}
        <div className="today__week">
          <p className="text-mono-label text-primary">{theme ? t('today.stripTheme', { n: sprint.number, theme }) : t('today.strip', { n: sprint.number })}</p>
          <h1 className="text-title-l text-primary">{t('today.dayOf', { d: day, n: sprint.length_days })}</h1>
          <SegmentedProgress variant="sprint" total={sprint.length_days} filled={day} label={t('today.dayOf', { d: day, n: sprint.length_days })} />
        </div>
        <div className="today__actions" data-tour="tools">
          <IconButton icon="book" label={t('today.tools')} onClick={() => openLibrary(navigate, '/today')} />
          <IconButton icon="notifications" label={t('today.notifications')} onClick={() => navigate('/reminders')} />
        </div>
      </header>

      <div className="today__stats">
        <StatChip fill icon="local_fire_department" value={<AnimatedNumber value={stats.streak} />} label={t('today.streak')} />
        <StatChip fill icon="calendar_today" value={<AnimatedNumber value={stats.days} />} label={t('today.days')} />
        <WeekStat percent={stats.week.percent} done={stats.week.done} target={stats.week.target} />
      </div>

      <AnimatePresence initial={false}>
        {showNudge && (
          <Collapse key="nudge">
            <div className="today__nudge glass-card" role="status">
              <span className="today__nudge-icon"><Icon name="notifications" size={20} /></span>
              <span className="text-body-s text-primary today__nudge-text">
                {left.length === 1 ? t('nudge.one', { m: leftMin }) : t('nudge.text', { n: left.length, m: leftMin })}
              </span>
              <TextButton label={t('nudge.later')} onClick={hideNudge} />
            </div>
          </Collapse>
        )}
      </AnimatePresence>

      <div className="today__section">
        <h2 className="text-title-m text-primary">{t('today.section')}</h2>
        <div className="today__progress">
          <SegmentedProgress variant="today" total={dailyList.length} filled={doneCount} />
          <span className="text-mono-caption text-primary">{resting ? t('today.resting') : `${doneCount}/${dailyList.length}`}</span>
        </div>
      </div>

      {items.map((item, i) => (
        <motion.div key={item.id} data-tour={i === 0 ? 'patches' : undefined} className="today__card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.08 + i * motionTokens.stagger }}>
          <PatchCard
            glyph={item.glyph}
            title={item.title}
            meta={partialMeta(item) ?? (item.per_week ? `${t('today.thisWeek', { n: weekCount(item.id), total: item.per_week })} · ${tiny ? item.versions.tiny.time : itemAmount(item, t, goals)}` : patchMeta(item, wake, bed, tiny, t, goals))}
            done={shareOf(item) >= 1}
            progress={shareOf(item)}
            dimmed={resting}
            onOpen={() => navigate(`/patch/${item.id}`)}
            onToggle={() => tick(item.id)}
            checkLabel={t('today.markDone', { title: item.title })}
          />
        </motion.div>
      ))}

      <CoachTeaser onOpen={() => setSheet('coach')} />

      {reviewDue(sprint, today) && <Button block label={reviewLabel(sprint)} onClick={() => navigate('/review')} />}

      <div className="today__chip" data-tour="tiny">
        {allDone ? (
          <MetaChip icon="task_alt" label={t('today.allDone')} />
        ) : resting ? (
          <MetaChip icon="verified_user" label={t('today.restOn')} />
        ) : (
          <>
            <MetaChip icon="bolt" label={t(tiny ? 'today.tinyOn' : 'today.tiny')} onClick={deadline ? undefined : onTinyChip} pressed={tiny} />
            {restAllowed && !lifeMode && <MetaChip icon="bedtime" label={t('today.rest')} onClick={() => setSheet('rest')} />}
          </>
        )}
        <MetaChip icon={lifeMode ? MODE_ICON[lifeMode.mode] : 'hourglass'} label={lifeMode ? t(`modes.kinds.${lifeMode.mode}.title`) : t('modes.chip')} onClick={() => setSheet('mode')} pressed={!!lifeMode} />
      </div>

      <BottomSheet open={sheet === 'coach'} onClose={() => setSheet(null)} eyebrow={t('coach.eyebrow').toUpperCase()} title={t('coach.sheetTitle')} decoration={<Mascot name="core-thinking" size={120} />}>
        <p className="text-body-m text-secondary">{t('coach.sheetBody')}</p>
        <ul className="coach-list">
          {tList('coach.points').map((x, i) => (
            <motion.li key={x} className="text-body-m text-primary" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...motionTokens.page, delay: 0.1 + i * motionTokens.stagger }}>
              <Icon name={(['ai_chat', 'ai_brain', 'ai_magic'] as const)[i % 3]} size={20} /> {x}
            </motion.li>
          ))}
        </ul>
        <p className="text-body-s text-secondary">{t('coach.privacy')}</p>
        <Button block label={t('coach.ok')} onClick={() => setSheet(null)} />
      </BottomSheet>

      <BottomSheet open={sheet === 'mode'} onClose={() => setSheet(null)} eyebrow={t('modes.intro').toUpperCase()} title={t('modes.title')}>
        <ModePicker current={lifeMode} onStart={async (k, d) => { setSheet(null); await startMode(k, d); }} />
      </BottomSheet>

      <BottomSheet open={!!message} onClose={dismissMessage} eyebrow={t('nav.today').toUpperCase()} title={message?.title ?? ''}>
        <p className="text-body-m text-secondary">{message?.body}</p>
        <Button block label={t('message.ok')} onClick={dismissMessage} />
      </BottomSheet>

      <BottomSheet open={welcome} onClose={closeWelcome} eyebrow={t('proWelcome.eyebrow').toUpperCase()} title={t('proWelcome.title')} decoration={<Mascot name="milestone-small-win" size={120} />}>
        <p className="text-body-m text-secondary">{t('proWelcome.body')}</p>
        <Button block label={t('proWelcome.cta')} onClick={closeWelcome} />
        <Button block variant="Ghost" label={t('proWelcome.more')} onClick={() => { closeWelcome(); navigate('/pro'); }} />
      </BottomSheet>

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

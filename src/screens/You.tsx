import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { WeekStat } from '../components/WeekStat';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import { currentStreak, totalActiveDays, weekPercent } from '../engine';
import { getItem } from '../data';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { AppNav } from './AppNav';
import { openLibrary } from './Library';
import { pad2 } from './flow';
import './today.css';

/**
 * You (Figma 2032:2654), first version: name, stats and Sign out.
 * Reminders row opens /reminders, Sleep times opens /sleep-times. Other settings (Hours, My patches, Data, Help) come later.
 */
export function You() {
  const navigate = useNavigate();
  const { user, profile, sprint, checkins, today, signOut, reminders, wake, bed, isAdmin } = useSession();
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    return {
      streak: currentStreak(checkins, today),
      days: totalActiveDays(checkins),
      week: sprint ? weekPercent(sprint, checkins, today, (id) => getItem(id)?.per_week) : { done: 0, target: 0, percent: 0 },
    };
  }, [checkins, sprint, today]);

  const out = async () => {
    setBusy(true);
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Screen>
      <header className="today__header">
        <div className="today__greeting">
          <p className="text-mono-label text-primary">{t('you.label', { nn: pad2(sprint?.number ?? 1) })}</p>
          <h1 className="text-title-l text-primary">{profile?.name || user?.name || ''}</h1>
        </div>
      </header>
      <div className="today__stats">
        <StatChip fill icon="local_fire_department" value={<AnimatedNumber value={stats.streak} />} label={t('today.streak')} />
        <StatChip fill icon="calendar_today" value={<AnimatedNumber value={stats.days} />} label={t('today.days')} />
        <WeekStat percent={stats.week.percent} done={stats.week.done} target={stats.week.target} />
      </div>
      <ListRow
        icon="notifications"
        title={t('you.reminders')}
        subtitle={reminders.push_enabled ? t('reminders.rowSubtitleOn', { time: reminders.remind_at }) : reminders.inapp_enabled ? t('reminders.rowSubtitleInapp', { time: reminders.remind_at }) : t('reminders.rowSubtitleOff')}
        onClick={() => navigate('/reminders')}
      />
      <ListRow icon="verified_user" title={t('you.pro')} subtitle={t('you.proSubtitle')} onClick={() => navigate('/pro')} />
      <ListRow icon="home" title={t('tour.replayTitle')} subtitle={t('tour.replaySubtitle')} onClick={() => navigate('/today', { state: { tour: true } })} />
      {isAdmin && <ListRow icon="settings" title={t('you.admin')} subtitle={t('admin.title')} onClick={() => navigate('/admin')} />}
      <ListRow icon="book" title={t('you.library')} subtitle={t('library.openSubtitle')} onClick={() => openLibrary(navigate, '/you')} />
      <ListRow icon="bedtime" title={t('you.sleepTimes')} subtitle={`${wake} – ${bed}`} onClick={() => navigate('/sleep-times')} />
      <p className="text-body-s text-secondary text-center">{t('you.email')} {user?.email}</p>
      <Button block variant="Ghost" label={t('you.signOut')} busy={busy} onClick={out} />
      <Spacer />
      <AppNav active="you" />
    </Screen>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Button } from '../components/Button';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import type { Area } from '../data/types';
import { areaScoresFromAnswers, currentStreak, overallScore, totalActiveDays, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { AppNav } from './AppNav';
import { pad2 } from './flow';
import './today.css';

/**
 * You (Figma 2032:2654), first version: name, stats and Sign out.
 * The settings list (Reminders, Hours, My patches, Data, Help) comes with Flows 5 and 7.
 */
export function You() {
  const navigate = useNavigate();
  const { user, profile, sprint, checkins, today, signOut } = useSession();
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const a = profile?.answers ?? {};
    const complete = (['Movement', 'Nutrition', 'Sleep', 'Mind'] as Area[]).every((k) => a[k] !== undefined);
    return {
      streak: currentStreak(checkins, today),
      days: totalActiveDays(checkins),
      score: complete ? overallScore(areaScoresFromAnswers(a as Record<Area, AnswerIndex>)) : 0,
    };
  }, [checkins, profile, today]);

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
        <StatChip fill icon="insights" value={<AnimatedNumber value={stats.score} decimals={1} />} label={t('today.score')} />
      </div>
      <p className="text-body-s text-secondary text-center">{t('you.email')} {user?.email}</p>
      <Button block variant="Ghost" label={t('you.signOut')} busy={busy} onClick={out} />
      <Spacer />
      <AppNav active="you" />
    </Screen>
  );
}

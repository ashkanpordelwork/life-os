import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { WeekStrip } from '../components/WeekStrip';
import { currentStreak, doneByDay, heatLevel, weekDays } from '../engine';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';

/** Done (Figma 56:393). Shown after the last patch of the day is ticked. */
export function Done() {
  const navigate = useNavigate();
  const { checkins, today, sprint } = useSession();
  const total = sprint?.patch_ids.length ?? 3;
  const counts = doneByDay(checkins);
  const letters = tList('done.weekdays');
  const days = weekDays(today).map((d, i) => {
    const n = counts.get(d) ?? 0;
    return { letter: letters[i], level: heatLevel(n, total), label: t('done.dayLabel', { day: d, n, total }) };
  });

  return (
    <Screen align="center">
      <Spacer />
      <Mascot name="milestone-small-win" size={238} animated />
      <p className="text-mono-label text-secondary text-center">{t('done.streak')}</p>
      <motion.p className="text-display-xl text-primary text-center" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...motionTokens.pop, delay: 0.15 }}>
        <AnimatedNumber value={currentStreak(checkins, today)} />
      </motion.p>
      <motion.h1 className="text-title-l text-primary text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.25 }}>
        {t('done.title')}
      </motion.h1>
      <WeekStrip title={t('done.week')} days={days} />
      <Spacer />
      <Button block label={t('done.cta')} onClick={() => navigate('/today')} />
    </Screen>
  );
}

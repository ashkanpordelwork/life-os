import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Icon, type IconName } from '../components/Icon';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { MIN_TRIP_DAYS, jetLagPlan } from '../engine';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import './library.css';

type Trip = 'short' | 'long';

/** Jet-lag plan (SL15, designed in code). Uses the user's wake time; all rules from the book. */
export function JetLag() {
  const navigate = useNavigate();
  const { wake } = useSession();
  const [hours, setHours] = useState(6);
  const [trip, setTrip] = useState<Trip>('long');
  const plan = jetLagPlan(wake, hours);
  const step = (d: number) => { haptic(6); setHours(Math.max(-12, Math.min(12, hours + d))); };
  const short = trip === 'short';

  const rows: { icon: IconName; title: string; body: string }[] = [];
  if (!short && plan.direction === 'east') {
    rows.push({ icon: 'event', title: t('jetlag.before'), body: t('jetlag.eastBefore') });
    rows.push({ icon: 'sunny', title: t('jetlag.lightAt', { from: plan.light![0], to: plan.light![1] }), body: t('jetlag.eastLight') });
    rows.push({ icon: 'bedtime', title: t('jetlag.darkAt', { from: plan.dark![0], to: plan.dark![1] }), body: t('jetlag.eastDark') });
  }
  if (!short && plan.direction === 'west') {
    rows.push({ icon: 'event', title: t('jetlag.before'), body: t('jetlag.westBefore') });
    rows.push({ icon: 'sunny', title: t('jetlag.lightAt', { from: plan.light![0], to: plan.light![1] }), body: t('jetlag.westLight') });
  }

  return (
    <Screen>
      <TopBar title={t('jetlag.title')} onBack={() => navigate('/library')} />
      <GlassPanel gap={8}>
        <span className="text-mono-label text-secondary">{t('jetlag.diffLabel')}</span>
        <div className="nutri__weight">
          <motion.button type="button" className="nutri__step text-title-m" aria-label={t('jetlag.earlier')} whileTap={{ scale: 0.9 }} onClick={() => step(-1)}>−</motion.button>
          <span className="text-display-xl text-primary nutri__value" aria-live="polite">{hours > 0 ? `+${hours}` : hours}<span className="text-title-m text-secondary"> h</span></span>
          <motion.button type="button" className="nutri__step text-title-m" aria-label={t('jetlag.later')} whileTap={{ scale: 0.9 }} onClick={() => step(1)}>+</motion.button>
        </div>
        <span className="text-body-s text-secondary text-center">
          {plan.direction === 'east' ? t('jetlag.east', { h: hours }) : plan.direction === 'west' ? t('jetlag.west', { h: -hours }) : t('jetlag.same')}
        </span>
        <div className="chip-wrap nutri__units" role="radiogroup" aria-label={t('jetlag.trip')}>
          <Chip label={t('jetlag.short', { n: MIN_TRIP_DAYS })} selected={short} onToggle={() => setTrip('short')} />
          <Chip label={t('jetlag.long', { n: MIN_TRIP_DAYS })} selected={!short} onToggle={() => setTrip('long')} />
        </div>
      </GlassPanel>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${plan.direction}-${short}-${hours}`} className="insights__section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: motionTokens.page }} exit={{ opacity: 0, transition: motionTokens.pageExit }}>
          {short || plan.direction === 'none' ? (
            <GlassPanel gap={8}><p className="text-body-m text-primary">{short ? t('jetlag.stayHome') : t('jetlag.noShift')}</p></GlassPanel>
          ) : (
            <>
              <p className="text-body-s text-secondary">{t('jetlag.tmin', { wake, time: plan.tminLocal })}</p>
              {rows.map((r) => (
                <div key={r.title} className="jet__row glass-card">
                  <span className="pro__icon"><Icon name={r.icon} size={20} /></span>
                  <span className="pro__text">
                    <span className="text-body-m-strong text-primary">{r.title}</span>
                    <span className="text-body-s text-secondary">{r.body}</span>
                  </span>
                </div>
              ))}
              <GlassPanel gap={8}>
                <span className="text-body-m-strong text-primary">{t('jetlag.bothTitle')}</span>
                <ul className="jet__list">{tList('jetlag.both').map((x) => <li key={x} className="text-body-s text-secondary">{x}</li>)}</ul>
              </GlassPanel>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <Spacer />
    </Screen>
  );
}

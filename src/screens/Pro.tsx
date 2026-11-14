import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Icon, type IconName } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { FREE_SPRINTS } from '../state/plan';
import { motionTokens } from '../styles/motion';
import './pro.css';

/** What Pro adds (owner decisions + engine-spec tier column). */
const FEATURES: { key: string; icon: IconName }[] = [
  { key: 'sprints', icon: 'route' },
  { key: 'levels', icon: 'trending_up' },
  { key: 'focus', icon: 'bolt' },
  { key: 'nutrition', icon: 'restaurant' },
  { key: 'travel', icon: 'event' },
  { key: 'supplements', icon: 'science' },
];

/** Free vs Pro. true = included. */
const COMPARE: { key: string; free: boolean | 'one'; pro: boolean }[] = [
  { key: 'sprints', free: 'one', pro: true },
  { key: 'level1', free: true, pro: true },
  { key: 'levels', free: false, pro: true },
  { key: 'calm', free: true, pro: true },
  { key: 'insights', free: true, pro: true },
  { key: 'tools', free: false, pro: true },
  { key: 'supplements', free: false, pro: true },
];

/**
 * Life OS Pro (designed in code, owner decision).
 * Hero card, what you get, Free vs Pro, and the user's status. No payment yet:
 * founders keep Pro for good, everyone else has it free during the beta.
 */
export function Pro() {
  const navigate = useNavigate();
  const { plan, profile } = useSession();
  const l2 = ITEMS.filter((i) => i.kind === 'patch' && i.level >= 2).length;
  const since = profile?.pro_since ? new Date(profile.pro_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
  const appear = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { ...motionTokens.page, delay: i * motionTokens.stagger } });

  return (
    <Screen>
      <TopBar title={t('pro.topTitle')} onBack={() => navigate(-1)} />

      <motion.section {...appear(0)} className="pro-hero" aria-labelledby="pro-title">
        <div className="pro-hero__text">
          <span className="pro-hero__badge text-mono-label">{t(`pro.status.${plan}`)}</span>
          <h1 id="pro-title" className="text-title-l">{t('pro.title')}</h1>
          <p className="text-body-s pro-hero__sub">{t('pro.subtitle')}</p>
        </div>
        <div className="pro-hero__art"><Mascot name="milestone-small-win" size={132} animated /></div>
      </motion.section>

      <motion.section {...appear(1)} className="pro-section" aria-labelledby="pro-get">
        <h2 id="pro-get" className="text-title-m text-primary">{t('pro.getTitle')}</h2>
        <div className="pro-grid">
          {FEATURES.map((f, i) => (
            <motion.div key={f.key} className="pro-feature glass-card" {...appear(2 + i * 0.5)}>
              <span className="pro__icon"><Icon name={f.icon} size={20} /></span>
              <span className="text-body-m-strong text-primary">{t(`pro.features.${f.key}.title`, { n: l2 })}</span>
              <span className="text-body-s text-secondary">{t(`pro.features.${f.key}.body`)}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section {...appear(4)} className="pro-section" aria-labelledby="pro-compare">
        <h2 id="pro-compare" className="text-title-m text-primary">{t('pro.compareTitle')}</h2>
        <GlassPanel gap={8}>
          <table className="pro-table">
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">{t('pro.feature')}</span></th>
                <th scope="col" className="text-mono-label text-secondary">{t('pro.free')}</th>
                <th scope="col" className="text-mono-label text-brand">{t('pro.pro')}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="text-body-s text-primary">{t(`pro.compare.${r.key}`)}</th>
                  <td>{r.free === 'one' ? <span className="text-mono-caption text-secondary">{t('pro.oneSprint', { n: FREE_SPRINTS })}</span> : <Mark on={r.free} />}</td>
                  <td>{r.pro === true && r.key === 'sprints' ? <span className="text-mono-caption text-brand">{t('pro.allSprints')}</span> : <Mark on={r.pro} brand />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </motion.section>

      <motion.div {...appear(5)} className="pro-status glass-card">
        <span className="pro__icon"><Icon name={plan === 'free' ? 'lock' : 'verified_user'} size={20} /></span>
        <span className="pro__text">
          <span className="text-body-m-strong text-primary">{t(`pro.statusTitle.${plan}`)}</span>
          <span className="text-body-s text-secondary">{plan === 'founder' && since ? t('pro.statusBody.founderSince', { date: since }) : t(`pro.statusBody.${plan}`)}</span>
        </span>
      </motion.div>
      <Spacer />
      {plan === 'free'
        ? <Button block label={t('pro.soonCta')} disabled />
        : <Button block label={t('pro.cta')} onClick={() => navigate('/today')} />}
    </Screen>
  );
}

function Mark({ on, brand }: { on: boolean; brand?: boolean }) {
  return on
    ? <span className={`pro-mark${brand ? ' pro-mark--brand' : ''}`} aria-label={t('pro.included')}><Icon name="check" size={16} /></span>
    : <span className="pro-mark pro-mark--off" aria-label={t('pro.notIncluded')}>–</span>;
}

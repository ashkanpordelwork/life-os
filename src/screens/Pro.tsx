import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Icon, type IconName } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { MetaChip } from '../components/MetaChip';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import { t } from '../i18n';
import { motionTokens } from '../styles/motion';
import './pro.css';

/** Pro features from docs/engine-spec.md (tier column). `ready` = built in the app today. */
const FEATURES: { key: string; icon: IconName; ready: boolean }[] = [
  { key: 'level2', icon: 'trending_up', ready: true },
  { key: 'level3', icon: 'local_fire_department', ready: true },
  { key: 'focus', icon: 'bolt', ready: true },
  { key: 'nutrition', icon: 'restaurant', ready: true },
  { key: 'travel', icon: 'event', ready: true },
  { key: 'supplements', icon: 'science', ready: true },
];

/**
 * Life OS Pro (designed in code, owner decision). Shows what Pro adds.
 * No payment yet: during the beta everything is open (owner decision), so there is no buy button.
 */
export function Pro() {
  const navigate = useNavigate();
  const level2 = ITEMS.filter((i) => i.kind === 'patch' && i.level === 2).length;
  const level3 = ITEMS.filter((i) => i.kind === 'patch' && i.level === 3).length;
  return (
    <Screen>
      <TopBar title={t('pro.topTitle')} onBack={() => navigate('/you')} />
      <div className="hero"><Mascot name="milestone-small-win" size={180} animated /></div>
      <p className="text-mono-label text-brand text-center">{t('pro.label')}</p>
      <h1 className="text-title-l text-primary text-center">{t('pro.title')}</h1>
      <p className="text-body-m text-secondary text-center">{t('pro.subtitle')}</p>
      <GlassPanel gap={14}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.key} className="pro__row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.1 + i * motionTokens.stagger }}>
            <span className="pro__icon"><Icon name={f.icon} size={20} /></span>
            <span className="pro__text">
              <span className="text-body-m-strong text-primary">{t(`pro.features.${f.key}.title`, { n: f.key === 'level3' ? level3 : level2 })}</span>
              <span className="text-body-s text-secondary">{t(`pro.features.${f.key}.body`)}</span>
            </span>
            {!f.ready && <span className="pro__soon text-mono-caption text-secondary">{t('pro.soon')}</span>}
          </motion.div>
        ))}
      </GlassPanel>
      <div className="pro__beta"><MetaChip icon="verified_user" label={t('pro.beta')} /></div>
      <Spacer />
      <Button block label={t('pro.cta')} onClick={() => navigate('/you')} />
    </Screen>
  );
}

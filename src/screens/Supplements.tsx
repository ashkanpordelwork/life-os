import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components/GlassPanel';
import { Icon } from '../components/Icon';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { SUPPLEMENTS } from '../data/supplements';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import './library.css';

/**
 * Supplement guides (designed in code). Reference only: never suggested by the engine (R16),
 * no streaks, no ticks. A safety note sits on top; a stronger one if the user ticked a health risk.
 */
export function Supplements() {
  const navigate = useNavigate();
  const { profile } = useSession();
  const h = profile?.health;
  const risk = !!(h?.pregnant || h?.heart || h?.ill);
  return (
    <Screen>
      <TopBar title={t('supps.title')} onBack={() => navigate('/library')} />
      <div className={`supps__warn${risk ? ' supps__warn--risk' : ''}`} role="note">
        <Icon name="info" size={20} />
        <span className="text-body-s">{t(risk ? 'supps.warnRisk' : 'supps.warn')}</span>
      </div>
      {SUPPLEMENTS.map((g, gi) => (
        <motion.section key={g.key} className="insights__section" aria-labelledby={`sup-${g.key}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: gi * motionTokens.stagger }}>
          <h2 id={`sup-${g.key}`} className="text-title-m text-primary">{t(`supps.groups.${g.key}`)}</h2>
          <GlassPanel gap={14}>
            {g.cards.map((c) => (
              <div key={c.name} className="supps__card">
                <div className="nutri__row">
                  <span className="text-body-m-strong text-primary">{c.name}</span>
                  <span className="text-mono-caption text-primary">{c.dose}</span>
                </div>
                {c.when && <span className="text-mono-caption text-secondary">{c.when}</span>}
                <span className="text-body-s text-secondary">{c.note}</span>
                {c.caution && <span className="text-body-s supps__caution"><Icon name="info" size={16} /> {c.caution}</span>}
              </div>
            ))}
          </GlassPanel>
        </motion.section>
      ))}
      <p className="text-body-s text-secondary">{t('supps.footer')}</p>
      <Spacer />
    </Screen>
  );
}

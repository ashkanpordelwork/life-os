import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { IconTile } from '../components/IconTile';
import type { IconName } from '../components/Icon';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { SettingRow } from '../components/SettingRow';
import { TopBar } from '../components/TopBar';
import type { HealthAnswers } from '../data/types';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { motionTokens } from '../styles/motion';
import { HEALTH_STEP, QUESTION_ROUTES, TOTAL_STEPS } from './flow';
import './onboarding.css';

const ROWS: { key: keyof HealthAnswers; icon: IconName }[] = [
  { key: 'pregnant', icon: 'person' },
  { key: 'heart', icon: 'monitoring' },
  { key: 'ill', icon: 'info' },
  { key: 'insomnia', icon: 'bedtime' },
];

/**
 * Health check (designed in code, owner decision). Feeds safety rules:
 * pregnancy, heart condition or illness → R06; trouble falling asleep → R01.
 */
export function Health() {
  const navigate = useNavigate();
  const { state, setHealth } = useOnboarding();
  return (
    <Screen>
      <TopBar title={t('health.topTitle')} trailing={t('common.step', { n: HEALTH_STEP, total: TOTAL_STEPS })} onBack={() => navigate(QUESTION_ROUTES.Mind)} />
      <SegmentedProgress total={TOTAL_STEPS} filled={HEALTH_STEP} />
      <IconTile glyph="Mind" size="L" />
      <h2 className="text-title-l text-primary">{t('health.title')}</h2>
      <p className="text-body-s text-secondary">{t('health.subtitle')}</p>
      <GlassPanel gap={8}>
        {ROWS.map((r, i) => (
          <motion.div key={r.key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ ...motionTokens.page, delay: 0.05 + i * motionTokens.stagger }}>
            <SettingRow icon={r.icon} label={t(`health.${r.key}`)} on={!!state.health[r.key]} onChange={(on) => setHealth({ ...state.health, [r.key]: on })} />
          </motion.div>
        ))}
      </GlassPanel>
      <p className="text-body-s text-secondary">{t('health.private')}</p>
      <Spacer />
      <Button block label={t('common.continue')} onClick={() => navigate('/safety')} />
    </Screen>
  );
}

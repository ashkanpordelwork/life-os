import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { NEED_TAGS } from '../data/types';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { TOTAL_STEPS } from './flow';
import './onboarding.css';

/** Symptoms (Figma 55:196). 8 chips, up to 3 can be picked. */
export function Symptoms() {
  const navigate = useNavigate();
  const { state, toggleSymptom } = useOnboarding();
  return (
    <Screen>
      <TopBar title={t('symptomsScreen.topTitle')} trailing={t('common.step', { n: 1, total: TOTAL_STEPS })} onBack={() => navigate('/')} />
      <SegmentedProgress total={TOTAL_STEPS} filled={1} />
      <h2 className="text-title-l text-primary">{t('symptomsScreen.title')}</h2>
      <p className="text-body-s text-secondary">{t('symptomsScreen.subtitle')}</p>
      <div className="chip-wrap">
        {NEED_TAGS.map((tag) => (
          <Chip key={tag} label={t(`symptoms.${tag}`)} selected={state.symptoms.includes(tag)} onToggle={() => toggleSymptom(tag)} />
        ))}
      </div>
      <Spacer />
      <Button block label={t('common.continue')} onClick={() => navigate('/question/movement')} />
    </Screen>
  );
}

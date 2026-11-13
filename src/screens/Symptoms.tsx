import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TopBar } from '../components/TopBar';
import { NEED_TAGS, type NeedTag } from '../data/types';
import { t } from '../i18n';
import { MAX_SYMPTOMS, useOnboarding } from '../state/onboarding';
import { TOTAL_STEPS } from './flow';
import './onboarding.css';

/** Symptoms (Figma 55:196). 8 chips, up to 3 can be picked. A 4th tap shows "Up to 3." */
export function Symptoms() {
  const navigate = useNavigate();
  const { state, toggleSymptom } = useOnboarding();
  const [limitHit, setLimitHit] = useState(false);
  const toggle = (tag: NeedTag) => {
    const adding = !state.symptoms.includes(tag);
    setLimitHit(adding && state.symptoms.length >= MAX_SYMPTOMS);
    toggleSymptom(tag);
  };
  return (
    <Screen>
      <TopBar title={t('symptomsScreen.topTitle')} trailing={t('common.step', { n: 1, total: TOTAL_STEPS })} onBack={() => navigate('/intro')} />
      <SegmentedProgress total={TOTAL_STEPS} filled={1} />
      <h2 className="text-title-l text-primary">{t('symptomsScreen.title')}</h2>
      <p className="text-body-s text-secondary">{t('symptomsScreen.subtitle')}</p>
      <div className="chip-wrap">
        {NEED_TAGS.map((tag) => (
          <Chip key={tag} label={t(`symptoms.${tag}`)} selected={state.symptoms.includes(tag)} onToggle={() => toggle(tag)} />
        ))}
      </div>
      <p className="text-caption text-brand" role="status">{limitHit ? t('symptomsScreen.limit') : ''}</p>
      <Spacer />
      <Button block label={t('common.continue')} onClick={() => navigate('/question/movement')} />
    </Screen>
  );
}

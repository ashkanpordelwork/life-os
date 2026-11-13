import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { IconTile } from '../components/IconTile';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { SleepTimes } from '../components/SleepTimes';
import { TopBar } from '../components/TopBar';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { QUESTION_ROUTES, TIMES_STEP, TOTAL_STEPS } from './flow';
import './onboarding.css';

/** Onboarding step 5 (added in code, owner decision): usual wake and bed time on iPhone-style wheels. */
export function SleepTimesStep() {
  const navigate = useNavigate();
  const { state, setTimes } = useOnboarding();
  return (
    <Screen>
      <TopBar title={t('sleepTimes.topTitle')} trailing={t('common.step', { n: TIMES_STEP, total: TOTAL_STEPS })} onBack={() => navigate(QUESTION_ROUTES.Sleep)} />
      <SegmentedProgress total={TOTAL_STEPS} filled={TIMES_STEP} />
      <IconTile glyph="Sleep" size="L" />
      <h2 className="text-title-l text-primary">{t('sleepTimes.title')}</h2>
      <p className="text-body-s text-secondary">{t('sleepTimes.subtitle')}</p>
      <SleepTimes
        wake={state.wake_time}
        bed={state.bed_time}
        onWake={(v) => setTimes({ wake_time: v })}
        onBed={(v) => setTimes({ bed_time: v })}
      />
      <Spacer />
      <Button block label={t('common.continue')} onClick={() => navigate(QUESTION_ROUTES.Mind)} />
    </Screen>
  );
}

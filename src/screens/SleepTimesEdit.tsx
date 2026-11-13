import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Screen, Spacer } from '../components/Screen';
import { SleepTimes } from '../components/SleepTimes';
import { TopBar } from '../components/TopBar';
import { t } from '../i18n';
import { useSession } from '../state/session';
import './onboarding.css';

/** You → Sleep times. Same wheels as onboarding. */
export function SleepTimesEdit() {
  const navigate = useNavigate();
  const { wake, bed, updateProfile } = useSession();
  const [w, setW] = useState(wake);
  const [b, setB] = useState(bed);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await updateProfile({ wake_time: w, bed_time: b }); } finally { setBusy(false); }
    navigate('/you');
  };
  return (
    <Screen>
      <TopBar title={t('sleepTimes.editTitle')} onBack={() => navigate('/you')} />
      <p className="text-body-s text-secondary">{t('sleepTimes.subtitle')}</p>
      <SleepTimes wake={w} bed={b} onWake={setW} onBed={setB} />
      <Spacer />
      <Button block label={t('sleepTimes.save')} busy={busy} disabled={w === wake && b === bed} onClick={save} />
    </Screen>
  );
}

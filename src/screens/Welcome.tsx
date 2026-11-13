import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { t } from '../i18n';
import './onboarding.css';

/** Welcome (Figma 55:163) */
export function Welcome() {
  const navigate = useNavigate();
  return (
    <Screen>
      <Spacer />
      <div className="hero">
        <Mascot name="core-welcome" size={272} />
      </div>
      <p className="text-mono-label text-brand text-center">{t('welcome.brand')}</p>
      <h1 className="text-title-l text-primary text-center">{t('welcome.title')}</h1>
      <p className="text-body-m text-secondary text-center">{t('welcome.subtitle')}</p>
      <Spacer />
      <Button block label={t('welcome.start')} onClick={() => navigate('/symptoms')} />
      {/* TODO(phase 3): sign in is not built yet. */}
      <Button block variant="Ghost" label={t('welcome.account')} />
    </Screen>
  );
}

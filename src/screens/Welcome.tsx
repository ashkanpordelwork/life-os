import { Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '../state/session';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { t } from '../i18n';
import './onboarding.css';

/** Welcome (Figma 55:163) */
export function Welcome() {
  const navigate = useNavigate();
  const { user, sprint } = useSession();
  if (user && sprint) return <Navigate to="/today" replace />;
  return (
    <Screen>
      <Spacer />
      <div className="hero">
        <Mascot name="core-welcome" size={272} animated />
      </div>
      <p className="text-mono-label text-brand text-center">{t('welcome.brand')}</p>
      <h1 className="text-title-l text-primary text-center">{t('welcome.title')}</h1>
      <p className="text-body-m text-secondary text-center">{t('welcome.subtitle')}</p>
      <Spacer />
      <Button block label={t('welcome.start')} onClick={() => navigate('/symptoms')} />
      <Button block variant="Ghost" label={t('welcome.account')} onClick={() => navigate('/login')} />
    </Screen>
  );
}

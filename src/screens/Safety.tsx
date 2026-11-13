import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { MetaChip } from '../components/MetaChip';
import { Screen, Spacer } from '../components/Screen';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { HEALTH_ROUTE } from './flow';
import './onboarding.css';

/**
 * Safety (Figma 2032:3562). Mascot, SAFETY label, "Stop if it hurts.", "Not medical advice" chip,
 * "I understand" and a text button. In onboarding the text button goes back (Figma's "Skip patch"
 * belongs to the per-patch use of this screen). One extra line shows only when a health risk was ticked.
 */
export function Safety() {
  const navigate = useNavigate();
  const { state, setSafetyOk } = useOnboarding();
  const risk = !!(state.health.pregnant || state.health.heart || state.health.ill);
  return (
    <Screen>
      <Spacer />
      <div className="hero">
        <Mascot name={risk ? 'safety-talk-to-a-doctor' : 'safety-safety'} size={238} animated />
      </div>
      <p className="text-mono-label text-secondary">{t('safety.label')}</p>
      <h1 className="text-title-l text-primary">{t('safety.title')}</h1>
      {risk && <p className="text-body-m text-secondary">{t('safety.risk')}</p>}
      <div className="safety__facts">
        <MetaChip icon="info" label={t('safety.notAdvice')} />
      </div>
      <Spacer />
      <Button block label={t('safety.ok')} onClick={() => { setSafetyOk(true); navigate('/score'); }} />
      <Button block variant="Ghost" label={t('common.back')} onClick={() => navigate(HEALTH_ROUTE)} />
    </Screen>
  );
}

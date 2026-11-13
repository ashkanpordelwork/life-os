import { Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '../state/session';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Confetti } from '../components/Confetti';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { getItem } from '../data';
import { t } from '../i18n';
import { useOnboarding } from '../state/onboarding';
import { pad2, sprintTheme } from './flow';
import './onboarding.css';

/** Sprint ready (Figma 55:450). Also defines Sprint, Patch and Release once. */
export function SprintReady() {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const session = useSession();
  const sprint = session.sprint ?? state.sprint;
  if (!sprint) return <Navigate to="/patches" replace />;

  const minutes = Math.max(1, Math.round(sprint.patch_ids.reduce((s, id) => s + (getItem(id)?.duration_min ?? 0), 0)));
  const nn = pad2(sprint.number);

  return (
    <Screen align="center">
      <Confetti />
      <Spacer />
      <Mascot name="core-pointing" size={238} animated />
      <p className="text-mono-label text-brand text-center">{t('ready.label', { nn, days: sprint.length_days })}</p>
      <h1 className="text-title-l text-primary text-center">{t('ready.title')}</h1>
      <p className="text-body-m text-secondary text-center">{t('ready.subtitle', { minutes })}</p>
      <GlassPanel gap={8}>
        <p className="text-mono-label text-secondary">{sprintTheme(sprint) ? `${t('ready.panelLabel', { nn })} · ${sprintTheme(sprint)}` : t('ready.panelLabel', { nn })}</p>
        <SegmentedProgress total={sprint.length_days} filled={0} />
      </GlassPanel>
      <ul className="definitions">
        <li className="text-body-s text-secondary">{t('ready.sprintDef')}</li>
        <li className="text-body-s text-secondary">{t('ready.patchDef')}</li>
        <li className="text-body-s text-secondary">{t('ready.releaseDef')}</li>
      </ul>
      <Spacer />
      {/* Not logged in yet: create an account first, then Today. */}
      <Button block label={t('ready.cta')} onClick={() => navigate(session.user ? '/today' : '/signup')} />
    </Screen>
  );
}

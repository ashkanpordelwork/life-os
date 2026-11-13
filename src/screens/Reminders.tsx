import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components/GlassPanel';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { SettingRow } from '../components/SettingRow';
import { StepList } from '../components/StepList';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { backend } from '../backend';
import { t, tList } from '../i18n';
import { permission, pushSupport, subscribe, unsubscribe } from '../state/push';
import { useSession } from '../state/session';
import './onboarding.css';

/** Reminders (Figma 2032:2782 settings + 2032:3464 blocked). Push and in-app only (no Telegram). */
export function Reminders() {
  const navigate = useNavigate();
  const { user, reminders, saveReminders, mode } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(permission() === 'denied');
  const support = pushSupport();
  const pushAvailable = mode === 'supabase' && support === 'ok';

  const togglePush = async (on: boolean) => {
    if (!user) return;
    setError('');
    setBusy(true);
    try {
      if (on) {
        const res = await subscribe();
        if (res === 'denied') { setDenied(true); return; }
        if (res === 'failed') { setError(t('reminders.failed')); return; }
        await backend.savePushSubscription(user.id, res);
        await saveReminders({ push_enabled: true });
      } else {
        const endpoint = await unsubscribe();
        if (endpoint) await backend.deletePushSubscription(user.id, endpoint);
        await saveReminders({ push_enabled: false });
      }
    } catch {
      setError(t('reminders.failed'));
    } finally {
      setBusy(false);
    }
  };

  const note =
    mode === 'local' ? t('reminders.localMode')
    : support === 'not-configured' ? t('reminders.notConfigured')
    : support === 'unsupported' ? t('reminders.unsupported')
    : '';

  return (
    <Screen>
      <TopBar title={t('reminders.topTitle')} onBack={() => navigate(-1)} />
      <GlassPanel gap={8}>
        <SettingRow icon="notifications" label={t('reminders.push')} on={reminders.push_enabled && pushAvailable} onChange={togglePush} disabled={!pushAvailable || busy} />
        <SettingRow icon="task_alt" label={t('reminders.inapp')} on={reminders.inapp_enabled} onChange={(on) => saveReminders({ inapp_enabled: on })} />
      </GlassPanel>
      <TextField label={t('reminders.time')} icon="timer" type="time" value={reminders.remind_at} onChange={(e) => e.target.value && saveReminders({ remind_at: e.target.value })} />
      <p className="text-body-s text-secondary">{t('reminders.hint')}</p>
      {note && <p className="text-caption text-secondary">{note}</p>}
      {error && <p className="text-body-s" role="alert" style={{ color: 'var(--color-status-danger)' }}>{error}</p>}

      {(support === 'needs-install' || (denied && pushAvailable)) && (
        <>
          <div className="hero"><Mascot name="state-reminder" size={160} animated /></div>
          <p className="text-mono-label text-secondary">{t('reminders.push')}</p>
          <h2 className="text-title-l text-primary">{support === 'needs-install' ? t('reminders.installTitle') : t('reminders.offTitle')}</h2>
          <GlassPanel gap={16}>
            <StepList steps={tList(support === 'needs-install' ? 'reminders.installSteps' : 'reminders.deniedSteps')} />
          </GlassPanel>
        </>
      )}
      <Spacer />
    </Screen>
  );
}

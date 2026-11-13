import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '../backend';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { TextButton } from '../components/TextButton';
import { TextField } from '../components/TextField';
import { t } from '../i18n';
import { useSession } from '../state/session';
import './auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorText(e: unknown) {
  return t(`auth.errors.${e instanceof AuthError ? e.code : 'unknown'}`);
}

/** Log in (Figma 2046:2963). The Figma "Name" field is moved to Create account (owner decision). */
export function Login() {
  const navigate = useNavigate();
  const { signIn, resetPassword, mode } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t(email ? 'auth.errors.emailFormat' : 'auth.errors.required');
    if (!password) next.password = t('auth.errors.required');
    setErrors(next);
    setNote('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate('/today', { replace: true });
    } catch (err) {
      setErrors({ form: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setErrors({});
    if (!EMAIL_RE.test(email.trim())) { setNote(t('auth.resetNeedEmail')); return; }
    try { await resetPassword(email.trim()); setNote(t('auth.resetSent')); } catch (err) { setErrors({ form: errorText(err) }); }
  };

  return (
    <Screen>
      <form className="auth" onSubmit={submit} noValidate>
        <div className="hero"><Mascot name="core-welcome" size={143} animated /></div>
        <p className="text-mono-label text-brand text-center">{t('auth.brand')}</p>
        <h1 className="text-title-l text-primary text-center">{t('auth.loginTitle')}</h1>
        <div className="auth__fields">
          <TextField label={t('auth.email')} icon="mail" type="email" autoComplete="email" inputMode="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <TextField label={t('auth.password')} icon="lock" type="password" autoComplete="current-password" placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        </div>
        {errors.form && <p className="text-body-s auth__error" role="alert">{errors.form}</p>}
        {note && <p className="text-body-s text-secondary text-center" role="status">{note}</p>}
        <Button block type="submit" label={t('auth.login')} busy={busy} />
        <Button block variant="Ghost" label={t('auth.forgot')} onClick={forgot} />
        {mode === 'local' && <p className="text-caption text-secondary text-center">{t('auth.localMode')}</p>}
        <Spacer />
        <div className="auth__switch">
          <span className="text-body-s text-secondary">{t('auth.newHere')}</span>
          <TextButton label={t('auth.signup')} onClick={() => navigate('/signup')} />
        </div>
      </form>
    </Screen>
  );
}

/** Create account (Figma 2046:3052) + Name field (owner decision). */
export function Signup() {
  const navigate = useNavigate();
  const { signUp, mode } = useSession();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; name?: string; password?: string; form?: string }>({});
  const [confirmFor, setConfirmFor] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t(email ? 'auth.errors.emailFormat' : 'auth.errors.required');
    if (!name.trim()) next.name = t('auth.errors.required');
    if (password.length < 8) next.password = t(password ? 'auth.errors.short' : 'auth.errors.required');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      if (result === 'confirm') setConfirmFor(email.trim());
      else navigate('/today', { replace: true });
    } catch (err) {
      setErrors({ form: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <form className="auth" onSubmit={submit} noValidate>
        <div className="hero"><Mascot name="core-welcome" size={143} animated /></div>
        <p className="text-mono-label text-brand text-center">{t('auth.brand')}</p>
        <h1 className="text-title-l text-primary text-center">{t('auth.signupTitle')}</h1>
        {confirmFor ? (
          <p className="text-body-m text-secondary text-center" role="status">{t('auth.confirmSent', { email: confirmFor })}</p>
        ) : (
          <>
            <div className="auth__fields">
              <TextField label={t('auth.email')} icon="mail" type="email" autoComplete="email" inputMode="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
              <TextField label={t('auth.name')} icon="person" autoComplete="given-name" placeholder={t('auth.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <TextField label={t('auth.password')} icon="lock" type="password" autoComplete="new-password" placeholder={t('auth.passwordNew')} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            </div>
            {errors.form && <p className="text-body-s auth__error" role="alert">{errors.form}</p>}
            <Button block type="submit" label={t('auth.signup')} busy={busy} />
            <p className="text-caption text-secondary text-center">{t('auth.terms')}</p>
            {mode === 'local' && <p className="text-caption text-secondary text-center">{t('auth.localMode')}</p>}
          </>
        )}
        <Spacer />
        <div className="auth__switch">
          <span className="text-body-s text-secondary">{t('auth.haveAccount')}</span>
          <TextButton label={t('auth.login')} onClick={() => navigate('/login')} />
        </div>
      </form>
    </Screen>
  );
}

import { useId, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import './TextField.css';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  icon: IconName;
  /** Error text under the field. Also turns the border red. */
  error?: string;
};

/**
 * TextField (from Figma Log in 2046:2963 / Create account 2046:3052, "Field group")
 * Mono label above; 52px input with a 20px icon; radius 14.
 * States: default, focus (border/focus), error (status/danger).
 */
export function TextField({ label, icon, error, ...input }: TextFieldProps) {
  const id = useId();
  const errId = `${id}-error`;
  return (
    <div className="text-field">
      <label htmlFor={id} className="text-mono-label text-secondary">{label}</label>
      <div className={`text-field__box${error ? ' text-field__box--error' : ''}`}>
        <Icon name={icon} size={20} className="text-field__icon" />
        <input id={id} className="text-field__input text-body-m" aria-invalid={!!error} aria-describedby={error ? errId : undefined} {...input} />
      </div>
      {error && <p id={errId} className="text-caption text-field__error" role="alert">{error}</p>}
    </div>
  );
}

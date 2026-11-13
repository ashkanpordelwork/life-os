import './Toggle.css';

type ToggleProps = {
  /** Figma property `State`: Off | On */
  on: boolean;
  onChange?: (on: boolean) => void;
  label: string;
};

/**
 * Toggle (Figma 2014:1459)
 * On/off switch for a single setting (reminders, notifications).
 * Use only for instant changes; never for choices that need a Save button.
 * Track uses action/primary when On, border/default when Off. Min touch area 44.
 */
export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle${on ? ' toggle--on' : ''}`} onClick={() => onChange?.(!on)}>
      <span className="toggle__track"><span className="toggle__knob" /></span>
    </button>
  );
}

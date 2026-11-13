import { Icon, type IconName } from './Icon';
import { Toggle } from './Toggle';
import './SettingRow.css';

/**
 * SettingRow (from Figma Reminder settings 2032:2782)
 * Brand icon, label, and a Toggle on the right. Used inside a GlassPanel.
 */
export function SettingRow({ icon, label, on, onChange, disabled }: { icon: IconName; label: string; on: boolean; onChange: (on: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`setting-row${disabled ? ' setting-row--disabled' : ''}`}>
      <span className="setting-row__icon"><Icon name={icon} size={20} /></span>
      <span className="text-body-m-strong text-primary setting-row__label">{label}</span>
      <Toggle on={on} label={label} onChange={disabled ? undefined : onChange} />
    </div>
  );
}

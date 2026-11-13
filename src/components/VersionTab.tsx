import { Icon, type IconName } from './Icon';
import './VersionTab.css';

type VersionTabProps = {
  icon: IconName;
  label: string;
  time: string;
  /** Figma property `State`: Off | On */
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * VersionTab (Figma 61:1084)
 * Pick Tiny / Standard / Stretch. Selected state changes fill, border and text colour.
 */
export function VersionTab({ icon, label, time, selected = false, onSelect }: VersionTabProps) {
  return (
    <button type="button" role="tab" aria-selected={selected} className={`version-tab${selected ? ' version-tab--on' : ''}`} onClick={onSelect}>
      <span className="version-tab__icon"><Icon name={icon} size={20} /></span>
      <span className="text-body-s text-primary">{label}</span>
      <span className="version-tab__time text-mono-caption">{time}</span>
    </button>
  );
}

import { Icon, type IconName } from './Icon';
import './MetaChip.css';

/**
 * MetaChip (Figma 61:1067)
 * Small fact chip: icon + mono value (duration, cue, evidence).
 */
export function MetaChip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="meta-chip">
      <span className="meta-chip__icon"><Icon name={icon} size={16} /></span>
      <span className="text-mono-caption text-primary">{label}</span>
    </span>
  );
}

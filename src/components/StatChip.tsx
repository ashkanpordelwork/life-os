import { Icon, type IconName } from './Icon';
import './glass.css';
import './StatChip.css';

/**
 * StatChip (Figma 61:1061)
 * Icon + number + one-word mono label.
 */
export function StatChip({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="stat-chip glass-card">
      <span className="stat-chip__icon"><Icon name={icon} size={20} /></span>
      <span className="text-mono-value text-primary">{value}</span>
      <span className="text-mono-label text-secondary">{label}</span>
    </div>
  );
}

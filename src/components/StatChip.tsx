import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './glass.css';
import './StatChip.css';

/**
 * StatChip (Figma 61:1061)
 * Icon + number + one-word mono label. `fill` stretches it to share a row (Today header).
 */
export function StatChip({ icon, value, label, fill }: { icon: IconName; value: ReactNode; label: string; fill?: boolean }) {
  return (
    <div className={`stat-chip glass-card${fill ? ' stat-chip--fill' : ''}`}>
      <span className="stat-chip__icon"><Icon name={icon} size={20} /></span>
      <span className="text-mono-value text-primary">{value}</span>
      <span className="text-mono-label text-secondary">{label}</span>
    </div>
  );
}

import './glass.css';
import './StatTile.css';

/**
 * StatTile (Figma 45:79)
 * Large stat block: a label and one value (e.g. score, days). Use on Progress and Score screens.
 * For compact stats in the Today header use StatChip instead.
 */
export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-tile glass-card">
      <span className="text-number text-primary">{value}</span>
      <span className="text-caption text-secondary">{label}</span>
    </div>
  );
}

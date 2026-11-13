import { SegmentedProgress } from './SegmentedProgress';
import './glass.css';
import './SprintStrip.css';

/**
 * SprintStrip (from Figma Today 2034:3528, "Sprint strip")
 * Glass card: "SPRINT 01" and "day/14", then one bar per Sprint day.
 */
export function SprintStrip({ label, day, length }: { label: string; day: number; length: number }) {
  return (
    <section className="sprint-strip glass-card">
      <div className="sprint-strip__row">
        <span className="text-mono-label text-primary">{label}</span>
        <span className="text-mono-caption text-primary">{day}/{length}</span>
      </div>
      <SegmentedProgress variant="sprint" total={length} filled={day} label={`${label} ${day}/${length}`} />
    </section>
  );
}

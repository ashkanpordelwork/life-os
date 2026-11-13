import { Icon } from './Icon';
import './SprintDot.css';

export type SprintStatus = 'Done' | 'Current' | 'Upcoming';

/**
 * SprintDot (Figma 44:68)
 * Roadmap sprint marker. Edit the number text on the instance.
 */
export function SprintDot({ status, number }: { status: SprintStatus; number: number }) {
  return (
    <span className={`sprint-dot sprint-dot--${status.toLowerCase()}`}>
      {status === 'Done' ? <Icon name="check" size={20} /> : <span className="text-title-s">{number}</span>}
    </span>
  );
}

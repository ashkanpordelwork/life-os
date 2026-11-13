import { Icon } from './Icon';
import './CheckCircle.css';

/**
 * Check target used by HabitCard and PatchCard (Figma "Check" layer).
 * 44x44 touch area, 28px circle. Done = status/success fill with a white check.
 */
export function CheckCircle({ done }: { done: boolean }) {
  return (
    <span className="check-target" aria-hidden="true">
      <span className={`check-circle${done ? ' check-circle--done' : ''}`}>{done && <Icon name="check" size={18} />}</span>
    </span>
  );
}

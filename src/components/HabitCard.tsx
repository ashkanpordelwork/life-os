import { Tag, type AreaVariant } from './Tag';
import { CheckCircle } from './CheckCircle';
import './glass.css';
import './HabitCard.css';

type HabitCardProps = {
  area: AreaVariant;
  title: string;
  meta: string;
  /** Figma property `State`: Todo | Done */
  done?: boolean;
  onToggle?: () => void;
};

/**
 * HabitCard (Figma 45:67)
 * One patch for today. Check target is 44x44. Swap the Tag variant per area; edit Title and Meta.
 */
export function HabitCard({ area, title, meta, done = false, onToggle }: HabitCardProps) {
  return (
    <button type="button" role="checkbox" aria-checked={done} className="habit-card glass-card" onClick={onToggle}>
      <span className="habit-card__content">
        <Tag area={area} />
        <span className="text-title-s text-primary">{title}</span>
        <span className="text-caption text-secondary">{meta}</span>
      </span>
      <CheckCircle done={done} />
    </button>
  );
}

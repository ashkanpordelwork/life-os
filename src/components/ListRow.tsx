import { Icon, type IconName } from './Icon';
import './ListRow.css';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon: IconName;
  onClick?: () => void;
};

/**
 * ListRow (Figma 45:68)
 * Generic tappable row (library items, settings). Min height 64.
 * Without `onClick` it is a plain info row: no chevron, not a button.
 */
export function ListRow({ title, subtitle, icon, onClick }: ListRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag {...(onClick ? { type: 'button' as const, onClick } : {})} className="list-row">
      <span className="list-row__bubble"><Icon name={icon} size={20} /></span>
      <span className="list-row__text">
        <span className="text-title-s text-primary">{title}</span>
        {subtitle && <span className="text-body-s text-secondary">{subtitle}</span>}
      </span>
      {onClick && <span className="list-row__chevron"><Icon name="chevron_right" size={20} /></span>}
    </Tag>
  );
}

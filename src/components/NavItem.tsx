import { Icon, type IconName } from './Icon';
import './NavItem.css';

type NavItemProps = {
  label: string;
  icon: IconName;
  /** Figma property `Active` */
  active?: boolean;
  onClick?: () => void;
};

/**
 * NavItem (Figma 45:16)
 * Bottom navigation item. Always icon + label.
 * Glyph colour is text/brand when active, text/secondary when not.
 */
export function NavItem({ label, icon, active = false, onClick }: NavItemProps) {
  return (
    <button type="button" className={`nav-item${active ? ' nav-item--active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon name={icon} size={24} />
      <span className="text-caption">{label}</span>
    </button>
  );
}

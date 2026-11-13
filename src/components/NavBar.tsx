import type { ReactNode } from 'react';
import './glass.css';
import './NavBar.css';

/**
 * NavBar (Figma 45:17)
 * Floating glass bottom navigation, max 4 items (NavItem).
 */
export function NavBar({ children }: { children: ReactNode }) {
  return <nav className="nav-bar glass-floating">{children}</nav>;
}

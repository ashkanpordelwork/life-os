import type { ReactNode } from 'react';
import './glass.css';
import './NavBar.css';

/**
 * NavBar (Figma 45:17)
 * Floating glass bottom navigation.
 * - compact: smaller and narrower, icons only (while scrolling down). Owner request.
 */
export function NavBar({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return <nav className={`nav-bar glass-floating${compact ? ' nav-bar--compact' : ''}`}>{children}</nav>;
}

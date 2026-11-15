import type { ReactNode } from 'react';
import './glass.css';
import './NavBar.css';

/**
 * NavBar (Figma 45:17)
 * Floating glass bottom navigation.
 * - compact: smaller and narrower, icons only (while scrolling down). Owner request.
 * - raised: stronger glass when content is under it.
 */
export function NavBar({ children, compact, raised }: { children: ReactNode; compact?: boolean; raised?: boolean }) {
  return <nav className={`nav-bar glass-floating${compact ? ' nav-bar--compact' : ''}${raised ? ' nav-bar--raised' : ''}`}>{children}</nav>;
}

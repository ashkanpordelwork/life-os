import type { ReactNode } from 'react';
import './Screen.css';

/**
 * Screen (layout, from the Figma screen frames 55:163 to 55:450)
 * Full-height column: screen gradient, 16px side padding, 16px gap between children.
 * Figma frames are 390 x 844; the layout works from 375 to 430 wide.
 * `align="center"` centres children horizontally (Welcome, Sprint ready).
 */
export function Screen({ children, align = 'start' }: { children: ReactNode; align?: 'start' | 'center' }) {
  return (
    <main className={`screen screen--${align}`}>
      {children}
    </main>
  );
}

/** Spacer: takes the free vertical space (Figma "Spacer" layers). */
export function Spacer() {
  return <div className="spacer" aria-hidden="true" />;
}

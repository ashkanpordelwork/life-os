import type { ReactNode } from 'react';
import './glass.css';
import './GlassPanel.css';

/**
 * GlassPanel (from Figma "By area" and "Sprint" panels, Glass/Card effect)
 * Glass surface, 16px padding, radius 20. `gap` is the space between children:
 * Starting score uses 14, Sprint ready uses 8 (values from Figma).
 */
export function GlassPanel({ children, gap = 8 }: { children: ReactNode; gap?: 8 | 14 | 16 }) {
  return <section className={`glass-panel glass-card glass-panel--gap-${gap}`}>{children}</section>;
}

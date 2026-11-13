import type { CSSProperties } from 'react';
import './Icon.css';

// Material Symbols (weight 400) exported from the Figma `Icon` page.
const files = import.meta.glob('../assets/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const urls: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace('.svg', '');
  urls[name] = url;
}

export const iconNames = Object.keys(urls).sort();

export type IconName =
  | 'air' | 'arrow_back' | 'bedtime' | 'bolt' | 'calendar_today' | 'check' | 'chevron_right'
  | 'directions_walk' | 'event' | 'fitness_center' | 'home' | 'info' | 'insights' | 'lock' | 'mail' | 'notifications'
  | 'local_cafe' | 'local_fire_department' | 'monitoring' | 'person'
  | 'restaurant' | 'route' | 'science' | 'self_improvement' | 'sunny'
  | 'task_alt' | 'timer' | 'trending_up' | 'tune' | 'water_drop';

type IconProps = {
  name: IconName;
  /** Size in px. Figma uses 16, 18, 20, 24 and 36. */
  size?: number;
  className?: string;
};

/**
 * Icon. The glyph takes the current text colour (`color`), so a parent sets the colour
 * with a semantic token, e.g. `color: var(--color-text-brand)`.
 */
export function Icon({ name, size = 24, className }: IconProps) {
  const style = {
    '--icon-size': `${size}px`,
    '--icon-url': `url("${urls[name]}")`,
  } as CSSProperties;
  return <span aria-hidden="true" className={['icon', className].filter(Boolean).join(' ')} style={style} />;
}

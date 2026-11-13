import { Icon, type IconName } from './Icon';
import './IconTile.css';

export type Glyph = 'Move' | 'Walk' | 'Nutrition' | 'Water' | 'Sleep' | 'Light' | 'Coffee' | 'Mind' | 'Breathe';

const glyphs: Record<Glyph, { icon: IconName; area: 'move' | 'nutrition' | 'sleep' | 'mind' }> = {
  Move: { icon: 'fitness_center', area: 'move' },
  Walk: { icon: 'directions_walk', area: 'move' },
  Nutrition: { icon: 'restaurant', area: 'nutrition' },
  Water: { icon: 'water_drop', area: 'nutrition' },
  Sleep: { icon: 'bedtime', area: 'sleep' },
  Light: { icon: 'sunny', area: 'sleep' },
  Coffee: { icon: 'local_cafe', area: 'sleep' },
  Mind: { icon: 'self_improvement', area: 'mind' },
  Breathe: { icon: 'air', area: 'mind' },
};

export const glyphNames = Object.keys(glyphs) as Glyph[];

/**
 * IconTile (Figma 61:1034)
 * Glyph tile in its area colour. Pick the glyph with the Glyph property
 * (Move, Walk, Nutrition, Water, Sleep, Light, Coffee, Mind, Breathe). Size M = 48, L = 72.
 */
export function IconTile({ glyph, size = 'M' }: { glyph: Glyph; size?: 'M' | 'L' }) {
  const g = glyphs[glyph];
  return (
    <span className={`icon-tile icon-tile--${size.toLowerCase()} icon-tile--${g.area}`} aria-hidden="true">
      <Icon name={g.icon} size={size === 'L' ? 36 : 24} />
    </span>
  );
}

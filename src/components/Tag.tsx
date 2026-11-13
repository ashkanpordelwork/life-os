import { t } from '../i18n';
import './Tag.css';

export type AreaVariant = 'Move' | 'Nutrition' | 'Sleep' | 'Mind';

/**
 * Tag (Figma 44:38)
 * Area label. Text is always ink; the dot carries the area colour and the label carries the meaning.
 */
export function Tag({ area }: { area: AreaVariant }) {
  return (
    <span className={`tag tag--${area.toLowerCase()}`}>
      <span className="tag__dot" aria-hidden="true" />
      <span className="text-caption">{t(`areas.${area}`)}</span>
    </span>
  );
}

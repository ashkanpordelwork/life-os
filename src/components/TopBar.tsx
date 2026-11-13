import { IconButton } from './IconButton';
import { t } from '../i18n';
import './TopBar.css';

type TopBarProps = {
  title: string;
  /** Optional trailing text (step counter or id), e.g. "1 / 6". */
  trailing?: string;
  onBack?: () => void;
};

/**
 * TopBar (Figma 2055:3095)
 * Navigation bar for pushed screens. Back button left, title centered,
 * optional trailing text (step counter or id) right.
 */
export function TopBar({ title, trailing, onBack }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar__side">
        {onBack && (
          <span className="top-bar__back"><IconButton icon="arrow_back" label={t('common.back')} onClick={onBack} /></span>
        )}
      </div>
      <h1 className="text-title-s text-primary text-center">{title}</h1>
      <div className="top-bar__side top-bar__side--end">
        {trailing && <span className="text-mono-label text-secondary">{trailing}</span>}
      </div>
    </header>
  );
}

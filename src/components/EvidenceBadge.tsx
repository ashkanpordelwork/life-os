import { t } from '../i18n';
import './EvidenceBadge.css';

export type EvidenceLevel = 'Strong' | 'Moderate' | 'Low' | 'Uncertain';

/**
 * EvidenceBadge (Figma 44:51)
 * Shows how strong the published evidence is for a habit. Never present Low/Uncertain as proven.
 */
export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`evidence evidence--${level.toLowerCase()}`}>
      <span className="evidence__dot" aria-hidden="true" />
      <span className="text-caption">{t(`evidence.${level}`)}</span>
    </span>
  );
}

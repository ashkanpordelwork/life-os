import { motion, useReducedMotion } from 'motion/react';
import { t } from '../i18n';
import { motionTokens } from '../styles/motion';
import { Icon } from './Icon';
import './CoachTeaser.css';

/**
 * CoachTeaser (added in code, owner decision): a lively banner for the coming AI Coach.
 * Not built yet: tapping opens a "coming soon" sheet.
 */
export function CoachTeaser({ onOpen }: { onOpen: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      className="coach"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.page}
      whileTap={{ scale: 0.98 }}
      aria-label={t('coach.aria')}
    >
      {/* Drifting colour blobs behind the glass */}
      <span className="coach__blobs" aria-hidden="true">
        <motion.span className="coach__blob coach__blob--a" animate={reduce ? undefined : { x: [0, 40, -10, 0], y: [0, -12, 10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.span className="coach__blob coach__blob--b" animate={reduce ? undefined : { x: [0, -50, 10, 0], y: [0, 14, -8, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.span className="coach__blob coach__blob--c" animate={reduce ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      </span>
      <span className="coach__icon">
        <motion.span animate={reduce ? undefined : { rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-flex' }}>
          <Icon name="ai_magic" size={26} />
        </motion.span>
      </span>
      <span className="coach__text">
        <span className="coach__row">
          <span className="text-title-s">{t('coach.title')}</span>
          <span className="coach__soon text-mono-caption">{t('coach.soon')}</span>
        </span>
        <span className="text-body-s coach__sub">{t('coach.subtitle')}</span>
      </span>
      <span className="coach__shine" aria-hidden="true" />
    </motion.button>
  );
}

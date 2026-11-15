import { motion } from 'motion/react';
import { t } from '../i18n';
import type { PlanState } from '../state/plan';
import { motionTokens } from '../styles/motion';
import { Icon } from './Icon';
import './ProBanner.css';

/**
 * ProBanner (added in code, owner request). A slim bar at the top of Today; one tap opens Pro.
 * Text follows the plan: Pro, Free (invites to ask for Pro) or a request waiting for approval.
 */
export function ProBanner({ plan, pending, onOpen }: { plan: PlanState; pending?: boolean; onOpen: () => void }) {
  const key = plan === 'free' && pending ? 'pending' : plan;
  return (
    <motion.button
      type="button"
      className="pro-banner"
      onClick={onOpen}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.page}
      whileTap={{ scale: 0.98 }}
    >
      <span className="pro-banner__shine" aria-hidden="true" />
      <span className="pro-banner__icon"><Icon name="verified_user" size={18} /></span>
      <span className="pro-banner__text text-body-s">
        <strong>{t(`proBanner.${key}.title`)}</strong> {t(`proBanner.${key}.body`)}
      </span>
      <Icon name="chevron_right" size={18} />
    </motion.button>
  );
}

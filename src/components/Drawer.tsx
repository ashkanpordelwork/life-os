import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motionTokens } from '../styles/motion';
import './Drawer.css';

/**
 * Drawer (added in code, owner request: a hamburger menu in Tribe).
 * A panel that slides in from the end side over a scrim. Close: tap the scrim, press Escape, or pick a row.
 * The panel is the only floating surface; nothing inside it clips a shadow.
 */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="drawer-layer">
          <motion.div className="drawer-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionTokens.page}
          >
            <h2 id={titleId} className="text-title-m text-primary">{title}</h2>
            <div className="drawer__body shadow-room">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

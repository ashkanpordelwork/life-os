import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motionTokens } from '../styles/motion';
import './BottomSheet.css';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small mono label above the title (Figma Day detail: "TUE · OCT 14"). */
  eyebrow?: string;
  /** Optional art that sits on the top edge (Figma Busy day: mascot top right). */
  decoration?: ReactNode;
  children: ReactNode;
};

/**
 * BottomSheet (from Figma Busy day 2033:3276 and Rest day 2033:3392, "Sheet" + "Scrim")
 * White card from the bottom, radius 28 on top, grabber, Shadow/Floating.
 * Scrim: text/primary at 45%. Close: tap the scrim, press Escape, or drag the sheet down.
 * Motion: slides up with a spring; scrim fades.
 */
export function BottomSheet({ open, onClose, title, eyebrow, decoration, children }: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-layer">
          <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {decoration && (
              <motion.div className="sheet__decoration" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...motionTokens.pop, delay: 0.12 }}>
                {decoration}
              </motion.div>
            )}
            <div className="sheet__handle"><span className="sheet__grabber" /></div>
            {eyebrow && <p className="text-mono-label text-secondary">{eyebrow}</p>}
            <h2 id={titleId} className="text-title-m text-primary">{title}</h2>
            {children}
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

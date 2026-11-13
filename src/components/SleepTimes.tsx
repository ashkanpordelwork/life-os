import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { t } from '../i18n';
import { motionTokens } from '../styles/motion';
import { Icon, type IconName } from './Icon';
import { WheelPicker } from './WheelPicker';
import './glass.css';
import './SleepTimes.css';

type Which = 'wake' | 'bed';

/** Hours between bed and wake, e.g. "8 h" or "7.5 h". */
export function sleepLength(wake: string, bed: string): string {
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const mins = (toMin(wake) - toMin(bed) + 1440) % 1440;
  return String(Math.round((mins / 60) * 2) / 2);
}

/**
 * SleepTimes (added in code). Two rows like iPhone Clock alarms: tap a row to open its time wheel.
 * Used in onboarding and in You → Sleep times.
 */
export function SleepTimes({ wake, bed, onWake, onBed }: { wake: string; bed: string; onWake: (v: string) => void; onBed: (v: string) => void }) {
  const [open, setOpen] = useState<Which>('wake');
  const rows: { key: Which; icon: IconName; label: string; value: string; set: (v: string) => void }[] = [
    { key: 'wake', icon: 'sunny', label: t('sleepTimes.wake'), value: wake, set: onWake },
    { key: 'bed', icon: 'bedtime', label: t('sleepTimes.bed'), value: bed, set: onBed },
  ];

  return (
    <div className="sleep-times">
      {rows.map((r) => (
        <div key={r.key} className="sleep-times__item glass-card">
          <button
            type="button"
            className="sleep-times__row"
            aria-expanded={open === r.key}
            onClick={() => setOpen(r.key)}
          >
            <span className="sleep-times__icon"><Icon name={r.icon} size={20} /></span>
            <span className="text-body-m-strong text-primary sleep-times__label">{r.label}</span>
            <motion.span
              key={r.value}
              className={`sleep-times__value text-title-s${open === r.key ? ' sleep-times__value--on' : ''}`}
              initial={{ scale: 0.92, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1, transition: motionTokens.pop }}
            >
              {r.value}
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === r.key && (
              <motion.div
                className="sleep-times__wheel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: motionTokens.page }}
                exit={{ height: 0, opacity: 0, transition: motionTokens.pageExit }}
              >
                <div className="sleep-times__wheel-inner">
                  <WheelPicker value={r.value} onChange={r.set} label={r.label} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      <p className="text-body-s text-secondary sleep-times__total">
        {t('sleepTimes.total', { h: sleepLength(wake, bed) })}
      </p>
    </div>
  );
}

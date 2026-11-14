import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { DailyLog, Metric } from '../engine';
import { METRICS } from '../engine';
import { t } from '../i18n';
import { haptic, motionTokens } from '../styles/motion';
import { Collapse } from './Collapse';
import { Icon } from './Icon';
import { TextButton } from './TextButton';
import './DailyCheckIn.css';

/**
 * DailyCheckIn (added in code, owner decision). One tap per row, 1–5:
 * energy, mood, last night's sleep, focus. When all four are in, it folds into a summary.
 * Feeds "What works for you" in Insights and self-experiments.
 */
export function DailyCheckIn({ log, onLog }: { log: DailyLog | undefined; onLog: (patch: Partial<Record<Metric, number>>) => void }) {
  const complete = METRICS.every((m) => typeof log?.[m] === 'number');
  const [editing, setEditing] = useState(false);
  const open = !complete || editing;

  return (
    <section className="checkin glass-card" aria-labelledby="checkin-title">
      <div className="checkin__head">
        <h2 id="checkin-title" className="text-title-s text-primary">{t(complete ? 'checkin.doneTitle' : 'checkin.title')}</h2>
        {complete && <TextButton label={editing ? t('checkin.close') : t('checkin.edit')} onClick={() => setEditing(!editing)} />}
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <Collapse key="rows">
            <div className="checkin__rows">
              {METRICS.map((m) => (
                <div key={m} className="checkin__row" role="radiogroup" aria-label={t(`checkin.metrics.${m}`)}>
                  <span className="text-body-s text-primary checkin__label">{t(`checkin.metrics.${m}`)}</span>
                  <div className="checkin__dots">
                    {[1, 2, 3, 4, 5].map((v) => {
                      const on = log?.[m] === v;
                      const filled = (log?.[m] ?? 0) >= v;
                      return (
                        <motion.button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={`${t(`checkin.metrics.${m}`)} ${v} / 5`}
                          className={`checkin__dot${filled ? ' checkin__dot--filled' : ''}${on ? ' checkin__dot--on' : ''}`}
                          whileTap={{ scale: 0.82 }}
                          animate={on ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={motionTokens.pop}
                          onClick={() => { haptic(8); onLog({ [m]: v }); }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="checkin__scale text-mono-caption text-secondary"><span>{t('checkin.low')}</span><span>{t('checkin.high')}</span></div>
            </div>
          </Collapse>
        ) : (
          <Collapse key="summary">
            <div className="checkin__summary">
              {METRICS.map((m, i) => (
                <motion.span key={m} className="checkin__chip text-mono-caption" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: i * motionTokens.stagger }}>
                  <Icon name="check" size={14} /> {t(`checkin.short.${m}`)} {log?.[m]}
                </motion.span>
              ))}
            </div>
          </Collapse>
        )}
      </AnimatePresence>
    </section>
  );
}

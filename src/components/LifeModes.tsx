import { motion } from 'motion/react';
import { useState } from 'react';
import { MODE_KINDS, type LifeMode, type ModeKind } from '../engine';
import { t } from '../i18n';
import { haptic, motionTokens } from '../styles/motion';
import { Button } from './Button';
import { Chip } from './Chip';
import { Icon, type IconName } from './Icon';
import { TextButton } from './TextButton';
import './LifeModes.css';

export const MODE_ICON: Record<ModeKind, IconName> = { deadline: 'hourglass', travel: 'airplane', sick: 'medicine', vacation: 'beach' };
const LENGTHS = [3, 7, 14] as const;

/** Mode picker (designed in code; Figma has a "Mode picker" frame idea). Pick a mode and how long. */
export function ModePicker({ current, onStart }: { current: LifeMode | null; onStart: (kind: ModeKind, days: number) => void }) {
  const [kind, setKind] = useState<ModeKind>(current?.mode ?? 'deadline');
  const [days, setDays] = useState<number>(7);
  return (
    <div className="modes">
      <div className="modes__grid" role="radiogroup" aria-label={t('modes.title')}>
        {MODE_KINDS.map((k, i) => (
          <motion.button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            className={`modes__card${kind === k ? ' modes__card--on' : ''}`}
            onClick={() => { haptic(8); setKind(k); }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={{ ...motionTokens.page, delay: i * motionTokens.stagger }}
          >
            <span className="modes__icon"><Icon name={MODE_ICON[k]} size={22} /></span>
            <span className="text-body-m-strong text-primary">{t(`modes.kinds.${k}.title`)}</span>
            <span className="text-body-s text-secondary">{t(`modes.kinds.${k}.body`)}</span>
          </motion.button>
        ))}
      </div>
      <span className="text-mono-label text-secondary">{t('modes.length')}</span>
      <div className="chip-wrap">
        {LENGTHS.map((n) => <Chip key={n} label={t(n === 7 ? 'modes.week' : n === 14 ? 'modes.twoWeeks' : 'modes.days', { n })} selected={days === n} onToggle={() => setDays(n)} />)}
      </div>
      <Button block label={t('modes.start', { mode: t(`modes.kinds.${kind}.title`) })} onClick={() => onStart(kind, days)} />
    </div>
  );
}

/** Banner on Today while a mode runs: what it changes, when it ends, and End. */
export function ModeBanner({ mode, onEnd, onJetLag }: { mode: LifeMode; onEnd: () => void; onJetLag: () => void }) {
  const until = new Date(mode.end_day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <motion.section className={`mode-banner mode-banner--${mode.mode}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={motionTokens.page} aria-label={t(`modes.kinds.${mode.mode}.title`)}>
      <span className="mode-banner__icon"><Icon name={MODE_ICON[mode.mode]} size={20} /></span>
      <div className="mode-banner__text">
        <span className="text-body-m-strong text-primary">{t(`modes.kinds.${mode.mode}.title`)} · {t('modes.until', { date: until })}</span>
        <span className="text-body-s text-secondary">{t(`modes.kinds.${mode.mode}.active`)}</span>
        {mode.mode === 'travel' && <TextButton label={t('modes.jetLag')} onClick={onJetLag} />}
      </div>
      <TextButton label={t('modes.end')} onClick={onEnd} />
    </motion.section>
  );
}

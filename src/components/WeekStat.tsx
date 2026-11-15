import { useState } from 'react';
import { t } from '../i18n';
import { AnimatedNumber } from './AnimatedNumber';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { StatChip } from './StatChip';
import './WeekStat.css';

/**
 * WeekStat (added in code, user feedback): "This week 60%" instead of the old score.
 * Tapping explains the number in plain words.
 */
export function WeekStat({ percent, done, target }: { percent: number; done: number; target: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="week-stat" onClick={() => setOpen(true)} aria-label={t('week.aria', { p: percent })}>
        <StatChip fill icon="insights" value={<><AnimatedNumber value={percent} />%</>} label={t('today.score')} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} eyebrow={t('today.score').toUpperCase()} title={t('week.title', { p: percent })}>
        <p className="text-body-m text-primary">{t('week.body', { n: done, total: target })}</p>
        <ul className="week-stat__list">
          <li className="text-body-s text-secondary">{t('week.daily')}</li>
          <li className="text-body-s text-secondary">{t('week.weekly')}</li>
          <li className="text-body-s text-secondary">{t('week.rest')}</li>
          <li className="text-body-s text-secondary">{t('week.reset')}</li>
        </ul>
        <Button block label={t('week.ok')} onClick={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}

import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Progress } from '../components/Progress';
import { Stepper } from '../components/Stepper';
import { TextButton } from '../components/TextButton';
import type { ChecklistItem, HabitGoal } from '../data/types';
import { clampGoal, goalProgress, goalValue, stepAmount } from '../engine';
import { t } from '../i18n';
import { formatAmount, formatOf } from './flow';

type GoalLogProps = {
  item: ChecklistItem & { goal: HabitGoal };
  /** The user's own goal, if they picked one. */
  mine?: number;
  /** Today's logged amount; undefined when not done, or ticked without an amount. */
  amount?: number;
  done: boolean;
  onSaveGoal: (n: number) => void;
  /** Save today's amount. 0 removes today's tick. */
  onLog: (n: number) => void;
};

/**
 * Personal goal + "How much today?" for habits with a number (steps, water, protein).
 * User feedback: pick your own goal (e.g. 5,000 steps) and log the real amount. Half still counts for the streak.
 */
export function GoalLog({ item, mine, amount, done, onSaveGoal, onLog }: GoalLogProps) {
  const goal = item.goal;
  const target = goalValue(goal, mine);
  const fmt = (n: number) => formatAmount(n, goal.unit, t);
  const [value, setValue] = useState(() => (done ? amount ?? target : 0));
  const [sheet, setSheet] = useState(false);
  const [draftGoal, setDraftGoal] = useState(target);
  const share = goalProgress(value, target);
  const changed = value !== (done ? amount ?? target : 0);

  return (
    <>
      {/* Flat content block: the goal is a fact; only "Change goal" is tappable. */}
      <section className="goal" aria-labelledby="goal-title">
        <div className="goal__head">
          <p id="goal-title" className="goal__label text-mono-label text-secondary"><Icon name="target" size={14} />{t('patch.goalLabel')}</p>
          <TextButton label={t('patch.goalEdit')} onClick={() => { setDraftGoal(target); setSheet(true); }} />
        </div>
        <p className="text-title-m text-primary">{fmt(target)}</p>
        {!mine && <p className="text-body-s text-secondary">{t('patch.goalDefault')}</p>}
      </section>

      <section className="goal-log" aria-labelledby="log-title">
        <h3 id="log-title" className="text-title-s text-primary">{t('patch.logTitle')}</h3>
        <Stepper
          display={fmt(value)}
          onLess={() => setValue((v) => stepAmount(goal, v, -1))}
          onMore={() => setValue((v) => stepAmount(goal, v, 1))}
          lessDisabled={value <= 0}
          lessLabel={t('patch.less')}
          moreLabel={t('patch.more')}
        />
        <Progress value={share} label={formatOf(value, target, goal.unit, t)} />
        <p className="text-body-s text-secondary">
          {formatOf(value, target, goal.unit, t)}
          {value > 0 && value < target ? ` · ${t('patch.logPartial')}` : ''}
        </p>
        <div className="goal-log__actions">
          <Button block variant="Secondary" label={t('patch.logFull')} onClick={() => { setValue(target); onLog(target); }} />
          <Button block label={t('patch.logSave')} disabled={!changed} onClick={() => onLog(value)} />
        </div>
      </section>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={t('patch.goalSheetTitle')}>
        <p className="text-body-m text-secondary">{t('patch.goalSheetBody')}</p>
        <Stepper
          display={fmt(draftGoal)}
          onLess={() => setDraftGoal((g) => clampGoal(goal, g - goal.step))}
          onMore={() => setDraftGoal((g) => clampGoal(goal, g + goal.step))}
          lessDisabled={draftGoal <= goal.min}
          moreDisabled={draftGoal >= goal.max}
          lessLabel={t('patch.less')}
          moreLabel={t('patch.more')}
        />
        <Button block label={t('patch.goalSave')} onClick={() => { onSaveGoal(draftGoal); setSheet(false); }} />
        {draftGoal !== goal.default && <TextButton label={t('patch.goalReset', { n: fmt(goal.default) })} onClick={() => setDraftGoal(goal.default)} />}
      </BottomSheet>
    </>
  );
}

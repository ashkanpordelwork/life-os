import { describe, expect, it } from 'vitest';
import { activeMode, pausedDays } from './modes';
import { currentStreak, REST_ID } from './streak';

const m = (mode: 'sick' | 'deadline' | 'vacation' | 'travel', start_day: string, end_day: string) => ({ id: start_day + mode, mode, start_day, end_day });

describe('life modes', () => {
  it('finds the mode running today', () => {
    expect(activeMode([m('deadline', '2026-03-01', '2026-03-07')], '2026-03-05')?.mode).toBe('deadline');
    expect(activeMode([m('deadline', '2026-03-01', '2026-03-07')], '2026-03-08')).toBeNull();
  });
  it('sick and vacation days are paused, up to today', () => {
    const p = pausedDays([m('sick', '2026-03-03', '2026-03-09'), m('deadline', '2026-03-01', '2026-03-02')], '2026-03-05');
    expect([...p]).toEqual(['2026-03-03', '2026-03-04', '2026-03-05']);
  });
  it('paused days keep the streak, like rest days', () => {
    const real = [{ day: '2026-03-01', item_id: 'SL01' }, { day: '2026-03-02', item_id: 'SL01' }];
    const paused = [...pausedDays([m('vacation', '2026-03-03', '2026-03-06')], '2026-03-06')].map((day) => ({ day, item_id: REST_ID }));
    expect(currentStreak([...real, ...paused], '2026-03-06')).toBe(2);
  });
});

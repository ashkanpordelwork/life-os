import { describe, expect, it } from 'vitest';
import type { Sprint } from '../data/types';
import { bestIndex, longestStreak, patchRates, weekdayCounts } from './insights';
import { REST_ID } from './streak';

const c = (day: string, item_id = 'SL01') => ({ day, item_id });

describe('longestStreak', () => {
  it('finds the longest run, rest days keep it going', () => {
    const list = [c('2026-03-01'), c('2026-03-02'), c('2026-03-03', REST_ID), c('2026-03-04'), c('2026-03-10'), c('2026-03-11')];
    expect(longestStreak(list)).toBe(3);
  });
  it('0 with nothing', () => expect(longestStreak([])).toBe(0));
});

describe('weekdayCounts', () => {
  it('counts counted days per weekday, Monday first', () => {
    // 2026-03-02 is a Monday, 2026-03-03 a Tuesday
    const list = [c('2026-03-02'), c('2026-03-09'), c('2026-03-03'), c('2026-03-03', 'NU02a')];
    expect(weekdayCounts(list, '2026-03-11', 2)).toEqual([2, 1, 0, 0, 0, 0, 0]);
  });
});

describe('patchRates', () => {
  it('done days per patch over started days', () => {
    const sprint: Sprint = { number: 1, theme: null, length_days: 14, patch_ids: ['SL01', 'NU02a'], started_at: new Date(2026, 2, 2, 9).toISOString() };
    const list = [c('2026-03-02'), c('2026-03-03'), c('2026-03-03', 'NU02a'), c('2026-02-20')];
    expect(patchRates(sprint, list, '2026-03-04')).toEqual([{ id: 'SL01', done: 2, days: 3 }, { id: 'NU02a', done: 1, days: 3 }]);
  });
});

describe('bestIndex', () => {
  it('single max only, -1 for a tie or all zero', () => {
    expect(bestIndex([1, 3, 2, 0])).toBe(1);
    expect(bestIndex([1, 3, 3, 0])).toBe(-1);
    expect(bestIndex([0, 0])).toBe(-1);
  });
});

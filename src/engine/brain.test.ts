import { describe, expect, it } from 'vitest';
import { ITEMS, getItem } from '../data';
import type { ChecklistItem, Sprint } from '../data/types';
import { REST_ID, addDays } from './streak';
import { sprintCompletion } from './levelFilter';
import { themeFor } from './theme';
import { dayOrder, timeHint } from './timeHint';

const it_ = (id: string) => getItem(id) as ChecklistItem;

describe('sprintCompletion', () => {
  const start = '2026-03-02';
  const sprint: Sprint = { number: 2, theme: null, length_days: 14, patch_ids: [], started_at: new Date(2026, 2, 2, 9).toISOString() };
  const done = (n: number) => Array.from({ length: n }, (_, i) => ({ day: addDays(start, i), item_id: 'SL01' }));

  it('counts days with 1+ patch over the Sprint length', () => {
    expect(sprintCompletion(sprint, done(10), addDays(start, 13))).toBeCloseTo(10 / 14);
  });

  it('leaves rest days out of the count', () => {
    const c = [...done(10), { day: addDays(start, 12), item_id: REST_ID }];
    expect(sprintCompletion(sprint, c, addDays(start, 13))).toBeCloseTo(10 / 13);
  });

  it('only counts days that have started', () => {
    expect(sprintCompletion(sprint, done(4), addDays(start, 4))).toBeCloseTo(4 / 5);
  });
});

describe('themeFor', () => {
  it('2+ morning patches → Morning basics', () => {
    expect(themeFor([it_('SL01'), it_('NU02a'), it_('EX01b')])).toBe('Morning basics');
  });
  it('otherwise the main area', () => {
    expect(themeFor([it_('EX01a'), it_('EX01d'), it_('SL11a')])).toBe('Move more');
    expect(themeFor([it_('SL03'), it_('SL14'), it_('NU04')])).toBe('Sleep base');
  });
  it('empty → null', () => expect(themeFor([])).toBeNull());
});

describe('timeHint', () => {
  it('wake-based windows', () => {
    expect(timeHint(it_('SL11b'), '07:00', '23:00')?.label).toBe('08:00–08:30');
    expect(timeHint(it_('SL01'), '06:30', '22:30')?.label).toBe('06:30–07:30');
  });
  it('bed-based times, also after midnight', () => {
    expect(timeHint(it_('SL03'), '07:00', '23:00')?.label).toBe('22:00');
    expect(timeHint(it_('SL14'), '08:00', '00:30')?.label).toBe('23:30');
  });
  it('meal and desk items have no clock time', () => {
    expect(timeHint(it_('EX01b'), '07:00', '23:00')).toBeNull();
    expect(timeHint(it_('FM05'), '07:00', '23:00')).toBeNull();
  });
  it('sorts the day in order', () => {
    const ids = ['SL14', 'NU04', 'SL01', 'FM05'].map(it_);
    const sorted = [...ids].sort((a, b) => dayOrder(a, '07:00', '23:00') - dayOrder(b, '07:00', '23:00')).map((i) => i.id);
    expect(sorted).toEqual(['SL01', 'FM05', 'NU04', 'SL14']);
  });
});

describe('level 2 data', () => {
  it('every patch has 3 versions and a tiny version', () => {
    for (const i of ITEMS.filter((x) => x.kind === 'patch')) {
      expect(i.versions.tiny.text && i.versions.standard.text && i.versions.stretch.text).toBeTruthy();
      expect(i.tiny_version).toBeTruthy();
    }
  });
  it('level 2 patches exist', () => {
    expect(ITEMS.filter((i) => i.level === 2).length).toBeGreaterThanOrEqual(13);
  });
});

describe('cutoff times', () => {
  it('caffeine and alcohol cutoffs are deadlines', () => {
    expect(timeHint(it_('SL11a'), '07:00', '23:00')).toMatchObject({ label: '13:00', cutoff: true });
    expect(timeHint(it_('SL12'), '07:00', '23:00')).toMatchObject({ label: '15:00', cutoff: true });
    expect(timeHint(it_('SL03'), '07:00', '23:00')?.cutoff).toBe(false);
  });
});

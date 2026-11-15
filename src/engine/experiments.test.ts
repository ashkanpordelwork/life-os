import { describe, expect, it } from 'vitest';
import { effectOf, topEffects, type DailyLog } from './experiments';
import { REST_ID, addDays } from './streak';

const start = '2026-03-01';
const day = (i: number) => addDays(start, i);

describe('effectOf', () => {
  // Morning light on even days; energy is 4 on those days, 2 otherwise.
  const checkins = Array.from({ length: 10 }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => ({ day: day(i), item_id: 'SL01' }));
  const logs: DailyLog[] = Array.from({ length: 10 }, (_, i) => ({ day: day(i), energy: i % 2 === 0 ? 4 : 2 }));

  it('compares done days with not-done days', () => {
    const e = effectOf('SL01', 'energy', checkins, logs)!;
    expect(e.withAvg).toBe(4);
    expect(e.withoutAvg).toBe(2);
    expect(e.change).toBeCloseTo(1);
  });
  it('needs enough days on each side', () => {
    expect(effectOf('SL01', 'energy', checkins, logs.slice(0, 4))).toBeNull();
  });
  it('leaves rest days out', () => {
    const withRest = [...checkins, { day: day(1), item_id: REST_ID }, { day: day(3), item_id: REST_ID }];
    expect(effectOf('SL01', 'energy', withRest, logs)!.nWithout).toBe(3);
  });
  it('topEffects keeps meaningful ones, biggest first', () => {
    const list = topEffects(['SL01', 'NU02a'], checkins, logs);
    expect(list[0]).toMatchObject({ itemId: 'SL01', metric: 'energy' });
  });
});


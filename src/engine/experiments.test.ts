import { describe, expect, it } from 'vitest';
import { effectOf, experimentResult, topEffects, type DailyLog } from './experiments';
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

describe('experimentResult', () => {
  it('compares the experiment with the days before it', () => {
    const logs: DailyLog[] = [
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ day: day(i), sleep: 2 })),
      ...[7, 8, 9, 10, 11, 12, 13].map((i) => ({ day: day(i), sleep: 4 })),
    ];
    const r = experimentResult({ id: 'x', item_id: 'SL14', metric: 'sleep', start_day: day(7), days: 7 }, [{ day: day(8), item_id: 'SL14' }], logs, day(14));
    expect(r).toMatchObject({ finished: true, elapsed: 7, doneDays: 1, during: 4, before: 2, change: 1 });
  });
});

import { describe, expect, it } from 'vitest';
import { REST_ID, addDays, canRestToday, currentStreak, dayKey, heatLevel, sprintDay, totalActiveDays, weekDays } from './streak';

const c = (day: string, item_id = 'SL01') => ({ day, item_id });

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const list = [c('2026-11-11'), c('2026-11-12'), c('2026-11-13')];
    expect(currentStreak(list, '2026-11-13')).toBe(3);
  });

  it('keeps yesterday\'s streak while today is still open', () => {
    const list = [c('2026-11-11'), c('2026-11-12')];
    expect(currentStreak(list, '2026-11-13')).toBe(2);
  });

  it('breaks after a missed day', () => {
    const list = [c('2026-11-10'), c('2026-11-12'), c('2026-11-13')];
    expect(currentStreak(list, '2026-11-13')).toBe(2);
    expect(currentStreak([c('2026-11-10')], '2026-11-13')).toBe(0);
  });

  it('one patch is enough for a day to count (owner rule)', () => {
    expect(currentStreak([c('2026-11-13', 'NU02a')], '2026-11-13')).toBe(1);
  });

  it('counts each day once in total days', () => {
    const list = [c('2026-11-12', 'A'), c('2026-11-12', 'B'), c('2026-11-13')];
    expect(totalActiveDays(list)).toBe(2);
  });
});

describe('dates', () => {
  it('formats local dates and adds days across months', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('Sprint day is 1 on the start day and stops at 14', () => {
    expect(sprintDay('2026-11-13', '2026-11-13')).toBe(1);
    expect(sprintDay('2026-11-13', '2026-11-17')).toBe(5);
    expect(sprintDay('2026-11-01', '2026-12-30')).toBe(14);
  });

  it('week runs Monday to Sunday', () => {
    const w = weekDays('2026-11-13'); // a Friday
    expect(w[0]).toBe('2026-11-09');
    expect(w[6]).toBe('2026-11-15');
  });
});

describe('heatLevel', () => {
  it('maps 0–3 patches to HeatCell levels', () => {
    expect([0, 1, 2, 3].map((n) => heatLevel(n, 3))).toEqual([0, 1, 3, 4]);
  });
});

describe('rest days (owner rules)', () => {
  const rest = (day: string) => ({ day, item_id: REST_ID });

  it('a rest day keeps the streak but does not add to it', () => {
    const list = [c('2026-11-10'), c('2026-11-11'), rest('2026-11-12'), c('2026-11-13')];
    expect(currentStreak(list, '2026-11-13')).toBe(3);
  });

  it('resting today keeps yesterday\'s streak', () => {
    expect(currentStreak([c('2026-11-11'), c('2026-11-12'), rest('2026-11-13')], '2026-11-13')).toBe(2);
  });

  it('rest days are not counted as active days', () => {
    expect(totalActiveDays([rest('2026-11-12'), c('2026-11-13')])).toBe(1);
  });

  it('allows only 1 rest day per week (Mon–Sun)', () => {
    expect(canRestToday([], '2026-11-13')).toBe(true);
    expect(canRestToday([rest('2026-11-10')], '2026-11-13')).toBe(false); // same week
    expect(canRestToday([rest('2026-11-08')], '2026-11-13')).toBe(true); // last Sunday, other week
    expect(canRestToday([rest('2026-11-13')], '2026-11-13')).toBe(false); // already resting
  });
});

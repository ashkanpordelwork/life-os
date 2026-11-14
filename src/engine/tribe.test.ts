import { describe, expect, it } from 'vitest';
import { timeAgo, tribeStreak } from './tribe';

const a = (user_id: string, day: string) => ({ user_id, day });

describe('tribeStreak', () => {
  it('counts days where at least half the members were active', () => {
    const active = [a('x', '2026-03-10'), a('y', '2026-03-10'), a('x', '2026-03-09'), a('x', '2026-03-08')];
    // 3 members → need 2. Only the 10th has 2.
    expect(tribeStreak(active, 3, '2026-03-10')).toBe(1);
    // 2 members → need 1: 8th, 9th, 10th.
    expect(tribeStreak(active, 2, '2026-03-10')).toBe(3);
  });
  it('today still open: counts from yesterday', () => {
    expect(tribeStreak([a('x', '2026-03-09')], 1, '2026-03-10')).toBe(1);
  });
  it('0 with no members', () => expect(tribeStreak([], 0, '2026-03-10')).toBe(0));
});

describe('timeAgo', () => {
  it('rounds to minutes, hours, days', () => {
    const now = new Date('2026-03-10T12:00:00Z').getTime();
    expect(timeAgo('2026-03-10T11:59:30Z', now)).toEqual({ n: 0, unit: 'now' });
    expect(timeAgo('2026-03-10T11:30:00Z', now)).toEqual({ n: 30, unit: 'm' });
    expect(timeAgo('2026-03-10T09:00:00Z', now)).toEqual({ n: 3, unit: 'h' });
    expect(timeAgo('2026-03-08T12:00:00Z', now)).toEqual({ n: 2, unit: 'd' });
  });
});

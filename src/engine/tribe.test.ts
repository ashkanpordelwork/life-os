import { describe, expect, it } from 'vitest';
import { timeAgo, tribeStreak, weekBoard } from './tribe';

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

describe('tribeChallenge', () => {
  it('counts active member-days this week against 4 per member', async () => {
    const { tribeChallenge } = await import('./tribe');
    // 2026-03-11 is a Wednesday; week starts Monday 2026-03-09.
    const active = [a('x', '2026-03-09'), a('x', '2026-03-10'), a('y', '2026-03-10'), a('x', '2026-03-10'), a('y', '2026-03-05')];
    const c = tribeChallenge(active, 2, '2026-03-11');
    expect(c).toMatchObject({ done: 3, goal: 8, lastDone: 1, reached: false });
  });
});

describe('weekBoard', () => {
  // 2026-03-04 is a Wednesday: the week is Mon 03-02 to today.
  const today = '2026-03-04';
  const ev = (user_id: string, kind: string, day: string, at = '10:00') => ({ user_id, kind, day, created_at: `${day}T${at}:00Z` });
  it('ranks by active days and crowns the leader', () => {
    const b = weekBoard([ev('a', 'active', '2026-03-02'), ev('a', 'active', '2026-03-03'), ev('b', 'active', '2026-03-03')], ['a', 'b', 'c'], today);
    expect(b.rows.map((r) => r.user_id)).toEqual(['a', 'b', 'c']);
    expect(b.rows.map((r) => r.crown)).toEqual([true, false, false]);
  });
  it('no crown in a week nobody was active', () => {
    expect(weekBoard([], ['a', 'b'], today).rows.some((r) => r.crown)).toBe(false);
  });
  it('early bird needs a clear winner with at least 2 firsts', () => {
    const e = [
      ev('a', 'all_done', '2026-03-02', '08:00'), ev('b', 'all_done', '2026-03-02', '09:00'),
      ev('a', 'all_done', '2026-03-03', '08:00'), ev('b', 'all_done', '2026-03-03', '09:00'),
    ];
    expect(weekBoard(e, ['a', 'b'], today).titles.find((x) => x.kind === 'earlyBird')?.user_id).toBe('a');
    expect(weekBoard(e.slice(0, 2), ['a', 'b'], today).titles.some((x) => x.kind === 'earlyBird')).toBe(false);
  });
  it('a tie gives no title', () => {
    const e = [ev('a', 'all_done', '2026-03-02'), ev('a', 'all_done', '2026-03-03'), ev('b', 'all_done', '2026-03-02'), ev('b', 'all_done', '2026-03-03')];
    expect(weekBoard(e, ['a', 'b'], today).titles.some((x) => x.kind === 'finisher')).toBe(false);
  });
  it('comeback: at least 2 more active days than last week', () => {
    const e = [ev('a', 'active', '2026-02-24'), ev('a', 'active', '2026-03-02'), ev('a', 'active', '2026-03-03'), ev('a', 'active', '2026-03-04'), ev('b', 'active', '2026-03-02')];
    const t = weekBoard(e, ['a', 'b'], today).titles;
    expect(t.find((x) => x.kind === 'comeback')?.user_id).toBe('a');
  });
});

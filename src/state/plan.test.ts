import { describe, expect, it } from 'vitest';
import { canStartSprint, hasPro, planState } from './plan';

describe('plans', () => {
  it('founders and paying users are Pro; others are beta while the lock is off', () => {
    expect(planState({ name: '', symptoms: [], answers: {}, founder: true })).toBe('founder');
    expect(planState({ name: '', symptoms: [], answers: {}, plan: 'pro' })).toBe('pro');
    expect(planState({ name: '', symptoms: [], answers: {} })).toBe('beta');
    expect(hasPro('beta')).toBe(true);
  });
  it('free users only get Sprint 1', () => {
    expect(canStartSprint('free', 1)).toBe(true);
    expect(canStartSprint('free', 2)).toBe(false);
    expect(canStartSprint('pro', 9)).toBe(true);
  });
});

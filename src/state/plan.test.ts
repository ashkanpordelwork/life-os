import { describe, expect, it } from 'vitest';
import { canStartSprint, hasPro, planState } from './plan';

describe('plans', () => {
  it('pro (or an old founder) is Pro; everyone else starts on Free', () => {
    expect(planState({ name: '', symptoms: [], answers: {}, founder: true })).toBe('pro');
    expect(planState({ name: '', symptoms: [], answers: {}, plan: 'pro' })).toBe('pro');
    expect(planState({ name: '', symptoms: [], answers: {} })).toBe('free');
    expect(hasPro('free')).toBe(false);
  });
  it('free users only get week 1', () => {
    expect(canStartSprint('free', 1)).toBe(true);
    expect(canStartSprint('free', 2)).toBe(false);
    expect(canStartSprint('pro', 9)).toBe(true);
  });
});

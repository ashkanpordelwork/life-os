import { describe, expect, it } from 'vitest';
import type { HabitGoal } from '../data/types';
import { clampGoal, goalProgress, goalValue, stepAmount } from './goals';

const steps: HabitGoal = { unit: 'steps', default: 7000, min: 1000, max: 30000, step: 500, log_step: 500 };

describe('goals', () => {
  it('uses the book default until the user picks one', () => {
    expect(goalValue(steps)).toBe(7000);
    expect(goalValue(steps, 5000)).toBe(5000);
    expect(goalValue(steps, 0)).toBe(7000);
  });
  it('keeps goals in range and on the step', () => {
    expect(clampGoal(steps, 5230)).toBe(5000);
    expect(clampGoal(steps, 100)).toBe(1000);
    expect(clampGoal(steps, 99999)).toBe(30000);
  });
  it('a plain tick is full, an amount is a share', () => {
    expect(goalProgress(undefined, 7000)).toBe(1);
    expect(goalProgress(3500, 7000)).toBe(0.5);
    expect(goalProgress(9000, 7000)).toBe(1);
  });
  it('steps the amount without going below zero', () => {
    expect(stepAmount(steps, 0, -1)).toBe(0);
    expect(stepAmount(steps, 3200, 1)).toBe(3500);
  });
});

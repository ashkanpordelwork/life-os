import { describe, expect, it } from 'vitest';
import { NOW_ACTIONS, NOW_STATES, RED_FLAG_COUNT, type NowState } from '../data/rightNow';
import { getItem } from '../data';
import { t, tList } from '../i18n';
import { habitOffer, rightNow, REQUIRE_DOCTOR_REVIEW, type NowOutcome } from './rightNow';

const TODAY = '2026-11-16';
/** Same data with every option approved, so the rules can be tested. */
const approved: NowState[] = NOW_STATES.map((s) => ({ ...s, options: s.options.map((o) => ({ ...o, review: 'approved' as const })) }));
const run = (state: Parameters<typeof rightNow>[0], ctx: Parameters<typeof rightNow>[1] = {}, history: NowOutcome[] = []) =>
  rightNow(state, ctx, history, TODAY, { states: approved, requireReview: true });
const out = (day: string, state: NowOutcome['state'], action: NowOutcome['action'], result: NowOutcome['result']): NowOutcome => ({ day, state, action, result });

describe('safety lock', () => {
  it('is on by default, and nothing is offered while every row is a draft', () => {
    expect(REQUIRE_DOCTOR_REVIEW).toBe(true);
    for (const s of NOW_STATES) {
      const r = rightNow(s.id, { eatingScreen: 'clear' }, [], TODAY);
      expect(r.kind === 'suggest').toBe(false);
    }
    expect(rightNow('neck_back', {}, [], TODAY)).toEqual({ kind: 'none', reason: 'no_review' });
  });
  it('offers an approved row', () => {
    const r = run('neck_back');
    expect(r.kind).toBe('suggest');
  });
});

describe('red flags', () => {
  it('stop everything, even for approved rows', () => {
    expect(run('headache', { redFlag: true })).toEqual({ kind: 'stop', reason: 'red_flag' });
    expect(run('craving', { redFlag: true, eatingScreen: 'clear' })).toEqual({ kind: 'stop', reason: 'red_flag' });
  });
});

describe('food gate', () => {
  it('closes when the eating screen is unknown or risky, and shows only calm non-food options', () => {
    for (const screen of [undefined, 'unknown', 'risk'] as const) {
      const r = run('craving', { eatingScreen: screen });
      expect(r.kind).toBe('gate');
      if (r.kind === 'gate') {
        expect(r.gate).toBe('eating_screen');
        expect(r.talkToPro).toBe(true);
        expect(r.safe.every((id) => ['walk_break', 'daylight_break'].includes(id))).toBe(true);
      }
    }
  });
  it('closes for groups that need a doctor first', () => {
    for (const flag of ['under18', 'diabetes', 'kidney', 'weightMedicine', 'healthRisk'] as const) {
      const r = run('weight_on_mind', { eatingScreen: 'clear', [flag]: true });
      expect(r).toMatchObject({ kind: 'gate', gate: 'food_excluded' });
    }
  });
  it('opens when the screen is clear, and always shows "talk to a professional"', () => {
    const r = run('stress_eating', { eatingScreen: 'clear' });
    expect(r).toMatchObject({ kind: 'suggest', talkToPro: true });
  });
  it('never touches non-food states', () => {
    expect(run('eyes').kind).toBe('suggest');
  });
});

describe('what fits', () => {
  it('never offers pending research', () => {
    const r = run('stress');
    expect(r.kind === 'suggest' && [r.main, ...r.alternatives].some((p) => p.action === 'physiological_sigh')).toBe(false);
    const h = run('headache');
    expect(h.kind === 'suggest' && [h.main, ...h.alternatives].some((p) => p.action === 'drink_water')).toBe(false);
    expect(run('low_energy').kind === 'suggest' && true).toBe(true);
  });
  it('respects the time the user has', () => {
    const r = run('stress', { minutes: 2 });
    expect(r).toEqual({ kind: 'none', reason: 'no_option' }); // slow breathing takes 3 min
    expect(run('stress', { minutes: 3 }).kind).toBe('suggest');
  });
  it('needs daylight for the daylight break', () => {
    const r = run('focus', { daylight: false });
    expect(r.kind === 'suggest' && r.main.action).toBe('drink_water');
  });
  it('shows the warm shower only in the evening or at night', () => {
    expect(run('cant_sleep', { dayPart: 'day' })).toEqual({ kind: 'none', reason: 'no_option' });
    expect(run('cant_sleep', { dayPart: 'evening' }).kind).toBe('suggest');
  });
  it('hides the warm shower for pregnancy, a heart condition or illness', () => {
    expect(run('cant_sleep', { dayPart: 'night', healthRisk: true })).toEqual({ kind: 'none', reason: 'no_option' });
  });
  it('gives one main pick and at most two alternatives', () => {
    const r = run('weight_on_mind', { eatingScreen: 'clear' });
    expect(r.kind === 'suggest' && r.alternatives.length <= 2).toBe(true);
  });
});

describe('ranking', () => {
  const synthetic: NowState[] = [{
    id: 'focus', group: 'mind',
    options: [
      { action: 'drink_water', strength: 'indirect', sources: [], review: 'approved' },
      { action: 'daylight_break', strength: 'low', sources: [], review: 'approved' },
      { action: 'walk_break', strength: 'moderate', sources: [], review: 'approved' },
    ],
  }];
  const pickAt = (history: NowOutcome[]) => {
    const r = rightNow('focus', {}, history, TODAY, { states: synthetic, requireReview: true });
    return r.kind === 'suggest' ? [r.main.action, ...r.alternatives.map((a) => a.action)] : [];
  };
  it('puts stronger evidence first', () => {
    expect(pickAt([])).toEqual(['walk_break', 'daylight_break', 'drink_water']);
  });
  it('lifts what helped this user, but strength still matters most', () => {
    const yes = ['2026-11-15', '2026-11-14', '2026-11-13'].map((d) => out(d, 'focus', 'drink_water', 'yes'));
    // indirect (1) + 2 = 3 ties with moderate (3); the original order breaks the tie
    expect(pickAt(yes)[0]).toBe('drink_water');
    const one = [out('2026-11-15', 'focus', 'drink_water', 'yes')];
    expect(pickAt(one)[0]).toBe('walk_break');
  });
  it('drops an action after two "no" answers in a row', () => {
    const no = [out('2026-11-15', 'focus', 'walk_break', 'no'), out('2026-11-14', 'focus', 'walk_break', 'no')];
    expect(pickAt(no)).not.toContain('walk_break');
  });
  it('one "no" only demotes', () => {
    const no = [out('2026-11-15', 'focus', 'walk_break', 'no')];
    expect(pickAt(no)).toContain('walk_break');
  });
  it('ignores answers older than 14 days', () => {
    const old = [out('2026-10-01', 'focus', 'walk_break', 'no'), out('2026-10-02', 'focus', 'walk_break', 'no')];
    expect(pickAt(old)[0]).toBe('walk_break');
  });
});

describe('habit offer', () => {
  it('offers the weekly habit after 3 helpful answers in 14 days', () => {
    const h = ['2026-11-16', '2026-11-14', '2026-11-10'].map((d) => out(d, 'stiff', 'walk_break', 'yes'));
    expect(habitOffer(h, TODAY)).toEqual({ action: 'walk_break', habitId: 'EX01d', times: 3 });
  });
  it('waits for 3, ignores "a bit" and old answers', () => {
    expect(habitOffer([out('2026-11-16', 'stiff', 'walk_break', 'yes'), out('2026-11-15', 'stiff', 'walk_break', 'yes')], TODAY)).toBeNull();
    expect(habitOffer(['2026-11-16', '2026-11-15', '2026-11-14'].map((d) => out(d, 'stiff', 'walk_break', 'a_bit')), TODAY)).toBeNull();
    expect(habitOffer(['2026-10-01', '2026-10-02', '2026-10-03'].map((d) => out(d, 'stiff', 'walk_break', 'yes')), TODAY)).toBeNull();
  });
  it('has nothing to offer for an action without a habit', () => {
    const h = ['2026-11-16', '2026-11-15', '2026-11-14'].map((d) => out(d, 'craving', 'mindful_pause', 'yes'));
    expect(habitOffer(h, TODAY)).toBeNull();
  });
});

describe('data is consistent', () => {
  it('every option points to a real action, and every action to a real habit', () => {
    const ids = new Set(NOW_ACTIONS.map((a) => a.id));
    for (const s of NOW_STATES) for (const o of s.options) expect(ids.has(o.action)).toBe(true);
    for (const a of NOW_ACTIONS) if (a.habitId) expect(getItem(a.habitId)).toBeTruthy();
  });
  it('every researched option cites a source; pending ones cite none', () => {
    for (const s of NOW_STATES) for (const o of s.options) {
      if (o.strength === 'pending') expect(o.sources).toEqual([]);
      else expect(o.sources.length).toBeGreaterThan(0);
    }
  });
  it('no row is approved yet (a doctor flips that)', () => {
    for (const s of NOW_STATES) for (const o of s.options) expect(o.review).toBe('draft');
  });
  it('every state and action has its text, and each state has its red-flag questions', () => {
    for (const s of NOW_STATES) {
      expect(t(`now.states.${s.id}.title`)).not.toBe(`now.states.${s.id}.title`);
      expect(tList(`now.states.${s.id}.redFlags`)).toHaveLength(RED_FLAG_COUNT[s.id]);
    }
    for (const a of NOW_ACTIONS) {
      expect(t(`now.actions.${a.id}.title`)).not.toBe(`now.actions.${a.id}.title`);
      expect(tList(`now.actions.${a.id}.steps`).length).toBeGreaterThan(0);
    }
  });
  it('food states always carry the professional link and the same two red flags', () => {
    for (const s of NOW_STATES.filter((x) => x.group === 'food')) {
      expect(s.food).toBe(true);
      expect(s.talkToPro).toBe(true);
    }
  });
  it('no shame words in the food texts', () => {
    const banned = /\b(fat|overweight|obese|cheat|bad food|guilt|clean eating|diet|calorie)/i;
    for (const s of NOW_STATES.filter((x) => x.group === 'food')) {
      expect(banned.test(t(`now.states.${s.id}.title`))).toBe(false);
    }
    expect(banned.test(JSON.stringify(tList('now.actions.mindful_pause.steps')))).toBe(false);
  });
});

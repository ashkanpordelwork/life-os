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

describe('the user is never blocked', () => {
  const every = (fn: (state: (typeof NOW_STATES)[number]['id'], ctx: Parameters<typeof rightNow>[1]) => void) => {
    const contexts = [
      {}, { redFlag: true }, { healthRisk: true }, { minutes: 1 }, { daylight: false }, { dayPart: 'night' as const },
      { eatingScreen: 'risk' as const }, { under18: true, diabetes: true, kidney: true, weightMedicine: true },
      { redFlag: true, healthRisk: true, minutes: 1, daylight: false, dayPart: 'night' as const },
    ];
    for (const st of NOW_STATES) for (const c of contexts) fn(st.id, c);
  };
  it('always gives a suggestion, for every state and every situation', () => {
    every((st, c) => {
      const r = rightNow(st, c, [], TODAY);
      expect(r.kind).toBe('suggest');
      if (r.kind === 'suggest') expect(r.main.action).toBeTruthy();
    });
  });
  it('the doctor lock is off by default (doctors supervise, nobody waits)', () => {
    expect(REQUIRE_DOCTOR_REVIEW).toBe(false);
    expect(rightNow('neck_back', {}, [], TODAY).kind).toBe('suggest');
  });
  it('the lock can be turned on: only approved rows, and then it can say none', () => {
    expect(rightNow('neck_back', {}, [], TODAY, { requireReview: true })).toEqual({ kind: 'none', reason: 'no_review' });
    expect(rightNow('neck_back', {}, [], TODAY, { requireReview: true, states: approved }).kind).toBe('suggest');
  });
  it('an unknown state returns none instead of crashing', () => {
    expect(rightNow('nope' as never, {}, [], TODAY)).toEqual({ kind: 'none', reason: 'unknown_state' });
  });
});

describe('the small note', () => {
  const advice = (st: Parameters<typeof rightNow>[0], ctx: Parameters<typeof rightNow>[1] = {}) => {
    const r = rightNow(st, ctx, [], TODAY);
    return r.kind === 'suggest' ? r.advice : null;
  };
  it('a red-flag "yes" adds one gentle sentence and keeps the suggestion', () => {
    expect(advice('headache', { redFlag: true })).toBe('note');
    const r = rightNow('headache', { redFlag: true }, [], TODAY);
    expect(r.kind === 'suggest' && r.main.action).toBe('neck_shoulder_relax');
  });
  it('food topics and low mood get a quiet hint', () => {
    for (const st of ['craving', 'stress_eating', 'weight_on_mind', 'low_mood'] as const) expect(advice(st)).toBe('hint');
  });
  it('other topics get no note unless a red flag was ticked', () => {
    for (const st of ['neck_back', 'eyes', 'stress', 'headache', 'stiff', 'focus', 'cant_sleep', 'low_energy'] as const) expect(advice(st)).toBe('none');
  });
  it('the eating screen and health groups only change the note, never the suggestion', () => {
    const base = rightNow('weight_on_mind', { eatingScreen: 'clear' }, [], TODAY);
    for (const ctx of [{ eatingScreen: 'risk' as const }, { diabetes: true }, { under18: true }, { healthRisk: true }, {}]) {
      const r = rightNow('weight_on_mind', ctx, [], TODAY);
      expect(r.kind).toBe('suggest');
      if (base.kind === 'suggest' && r.kind === 'suggest' && !ctx.healthRisk) expect(r.main.action).toBe(base.main.action);
    }
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
  it('prefers what fits the time, but never leaves the user with nothing', () => {
    // headache: only a 3-minute action exists; with 2 minutes it is still offered rather than nothing
    const r = run('headache', { minutes: 2 });
    expect(r.kind === 'suggest' && r.main.action).toBe('neck_shoulder_relax');
    // stress with 2 minutes: the 3-minute breathing stays (the sigh is pending research)
    const s2 = run('stress', { minutes: 2 });
    expect(s2.kind === 'suggest' && s2.main.action).toBe('slow_breathing');
    // when a shorter option exists, it wins
    const quick = rightNow('neck_back', { minutes: 2 }, [], TODAY);
    expect(quick.kind === 'suggest' && quick.main.action).toBe('shoulder_neck_reset');
  });
  it('needs daylight for the daylight break', () => {
    const r = run('focus', { daylight: false });
    expect(r.kind === 'suggest' && r.main.action).toBe('drink_water');
  });
  it('shows the warm shower in the evening or at night; by day it still gives something', () => {
    const eve = run('cant_sleep', { dayPart: 'evening' });
    expect(eve.kind === 'suggest' && eve.main.action).toBe('warm_shower');
    const day = run('cant_sleep', { dayPart: 'day' });
    expect(day.kind === 'suggest' && day.main.action).toBe('warm_shower'); // relaxed: the moment can't hide the only option
  });
  it('never offers the warm shower to pregnancy, a heart condition or illness: it picks another action', () => {
    const r = run('cant_sleep', { dayPart: 'night', healthRisk: true });
    expect(r.kind).toBe('suggest');
    expect(r.kind === 'suggest' && r.main.action).toBe('slow_breathing');
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
  it('every row is a draft until a doctor approves it', () => {
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
  it('food states carry the quiet professional hint', () => {
    for (const s of NOW_STATES.filter((x) => x.group === 'food')) {
      expect(s.food).toBe(true);
      expect(s.talkToPro).toBe(true);
    }
  });
  it('the note texts exist', () => {
    expect(t('now.advice.hint')).not.toBe('now.advice.hint');
    expect(t('now.advice.note')).not.toBe('now.advice.note');
  });
  it('no shame words in the food texts', () => {
    const banned = /\b(fat|overweight|obese|cheat|bad food|guilt|clean eating|diet|calorie)/i;
    for (const s of NOW_STATES.filter((x) => x.group === 'food')) {
      expect(banned.test(t(`now.states.${s.id}.title`))).toBe(false);
    }
    expect(banned.test(JSON.stringify(tList('now.actions.mindful_pause.steps')))).toBe(false);
  });
});

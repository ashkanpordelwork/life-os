import { describe, expect, it } from 'vitest';
import { ITEMS } from '../data';
import type { ChecklistItem } from '../data/types';
import {
  allowedLevels, answerToScore, compose4, levelFilter, overallScore, recommend,
  safetyFilter, scoreItem, type AreaScores,
} from '.';

// Example from docs/engine-spec.md 3-A (Figma numbers).
// Owner decision: Morning light uses the book (5–10 min, so Q = 1). It now ties Delay coffee (SL11b)
// at 4.5 and wins the tie, so the Sleep offer is SL01 instead of the spec's SL11b.
const figmaScores: AreaScores = { Movement: 2.0, Nutrition: 3.0, Sleep: 2.5, Mind: 2.1 };

const item = (over: Partial<ChecklistItem>): ChecklistItem => ({
  ...ITEMS[0],
  id: 'X', kind: 'patch', level: 1, safety_rules: [], needs: [], duration_min: 1,
  ...over,
});

describe('worked example from engine-spec', () => {
  it('fog + sleep + energy -> SL01, NU02a, EX01b, FM05', () => {
    const offers = recommend({ items: ITEMS, symptoms: ['fog', 'sleep', 'energy'], scores: figmaScores, sprintNumber: 1 });
    expect(offers.map((o) => o.item.id)).toEqual(['SL01', 'NU02a', 'EX01b', 'FM05']);
  });

  it('matches the scores in the spec table (4.5, 4.3, 3.7, 3.7)', () => {
    const offers = recommend({ items: ITEMS, symptoms: ['fog', 'sleep', 'energy'], scores: figmaScores, sprintNumber: 1 });
    expect(offers.map((o) => Math.round(o.score * 10) / 10)).toEqual([4.5, 4.3, 3.7, 3.7]);
  });

  it('keeps the 4 offers under about 12 minutes', () => {
    const offers = recommend({ items: ITEMS, symptoms: ['fog', 'sleep', 'energy'], scores: figmaScores, sprintNumber: 1 });
    expect(offers.reduce((s, o) => s + o.item.duration_min, 0)).toBeLessThanOrEqual(12);
  });

  it('gives one offer per area', () => {
    const offers = recommend({ items: ITEMS, symptoms: ['msk', 'stress'], scores: figmaScores, sprintNumber: 1 });
    expect(new Set(offers.map((o) => o.item.area)).size).toBe(4);
  });
});

describe('scoreItem', () => {
  it('counts matching tags (max 3), gap, Q and E', () => {
    const sl11b = ITEMS.find((i) => i.id === 'SL11b')!;
    expect(scoreItem(sl11b, ['fog', 'sleep', 'energy'], figmaScores)).toEqual({ M: 2, gap: 2.5, Q: 1, E: 0.5, score: 4.5 });
  });

  it('caps M at 3', () => {
    const many = item({ needs: ['fog', 'sleep', 'energy', 'msk'] });
    expect(scoreItem(many, ['fog', 'sleep', 'energy', 'msk'], figmaScores).M).toBe(3);
  });

  it('Q is 0 above 5 minutes', () => {
    const long = item({ duration_min: 6 });
    expect(scoreItem(long, [], figmaScores).Q).toBe(0);
    expect(scoreItem(item({ duration_min: 5 }), [], figmaScores).Q).toBe(1);
  });
});

describe('safetyFilter', () => {
  it('R14: drops FM01f when "Skipping meals" is picked', () => {
    const fm01f = item({ id: 'FM01f', area: 'Mind' });
    expect(safetyFilter([fm01f], { symptoms: ['meals'] })).toEqual([]);
    expect(safetyFilter([fm01f], { symptoms: ['fog'] })).toEqual([fm01f]);
  });

  it('R01: drops napping (SL07) for insomnia', () => {
    const sl07 = item({ id: 'SL07' });
    expect(safetyFilter([sl07], { symptoms: [], flags: { insomnia: true } })).toEqual([]);
    expect(safetyFilter([sl07], { symptoms: [] })).toEqual([sl07]);
  });

  it('R05 / R06: drop cold exposure (ST02)', () => {
    const st02 = item({ id: 'ST02' });
    expect(safetyFilter([st02], { symptoms: [], flags: { resistanceTrainingWithin8h: true } })).toEqual([]);
    expect(safetyFilter([st02], { symptoms: [], flags: { healthRisk: true } })).toEqual([]);
  });

  it('R16: never offers library items or supplements', () => {
    expect(safetyFilter([item({ kind: 'library' })], { symptoms: [] })).toEqual([]);
    expect(safetyFilter([item({ safety_rules: ['R16'] })], { symptoms: [] })).toEqual([]);
  });

  it('R15: never offers PG03 / PG04', () => {
    expect(safetyFilter([item({ id: 'PG03' }), item({ id: 'PG04' })], { symptoms: [] })).toEqual([]);
  });
});

describe('levelFilter', () => {
  const l1 = item({ id: 'A', level: 1 });
  const l2 = item({ id: 'B', level: 2 });
  const l3 = item({ id: 'C', level: 3 });

  it('Sprint 1 and 2 allow level 1 only', () => {
    expect(allowedLevels(1)).toEqual([1]);
    expect(levelFilter([l1, l2, l3], 2)).toEqual([l1]);
  });

  it('Sprint 3–4 add level 2, Sprint 5+ adds level 3', () => {
    expect(levelFilter([l1, l2, l3], 3)).toEqual([l1, l2]);
    expect(levelFilter([l1, l2, l3], 5)).toEqual([l1, l2, l3]);
  });
});

describe('compose4', () => {
  it('borrows from the area with the biggest gap when an area is empty', () => {
    const scored = [
      { item: item({ id: 'M1', area: 'Movement' }), score: 3 },
      { item: item({ id: 'M2', area: 'Movement' }), score: 2 },
      { item: item({ id: 'N1', area: 'Nutrition' }), score: 3 },
      { item: item({ id: 'S1', area: 'Sleep' }), score: 3 },
      { item: item({ id: 'S2', area: 'Sleep' }), score: 2.5 },
    ];
    // No Mind items. Movement has the biggest gap (3.0), so M2 fills the 4th slot.
    expect(compose4(scored, figmaScores).map((x) => x.item.id).sort()).toEqual(['M1', 'M2', 'N1', 'S1']);
  });

  it('swaps the weakest offer when the total is over 12 minutes', () => {
    const scored = [
      { item: item({ id: 'M1', area: 'Movement', duration_min: 10 }), score: 2 },
      { item: item({ id: 'M2', area: 'Movement', duration_min: 1 }), score: 1.5 },
      { item: item({ id: 'N1', area: 'Nutrition', duration_min: 2 }), score: 4 },
      { item: item({ id: 'S1', area: 'Sleep', duration_min: 2 }), score: 4 },
      { item: item({ id: 'D1', area: 'Mind', duration_min: 2 }), score: 4 },
    ];
    const ids = compose4(scored, figmaScores).map((x) => x.item.id);
    expect(ids).toContain('M2');
    expect(ids).not.toContain('M1');
  });

  it('never offers tools (ST01a) as Sprint patches', () => {
    const offers = recommend({ items: ITEMS, symptoms: ['stress'], scores: figmaScores, sprintNumber: 1 });
    expect(offers.map((o) => o.item.id)).not.toContain('ST01a');
  });
});

describe('area scores', () => {
  it('maps the 4 answers onto 0–5 (confirmed by the owner)', () => {
    expect([0, 1, 2, 3].map((a) => answerToScore(a as 0 | 1 | 2 | 3))).toEqual([0, 1.7, 3.3, 5]);
  });

  it('overall score is the average (Figma 2.0 / 3.0 / 2.5 / 2.1 -> 2.4)', () => {
    expect(overallScore(figmaScores)).toBe(2.4);
  });
});

describe('data', () => {
  it('has the 14 level-1 starter items with three versions each', () => {
    expect(ITEMS.map((i) => i.id)).toEqual([
      'SL01', 'SL04', 'SL11a', 'SL11b', 'EX01a', 'EX01b', 'EX01c', 'EX01d', 'NU02a', 'NU02b', 'NU03a', 'ST01a', 'ST04', 'FM05',
    ]);
    for (const i of ITEMS) {
      expect(i.level).toBe(1);
      expect(Object.keys(i.versions)).toEqual(['tiny', 'standard', 'stretch']);
      expect(i.tiny_version.length).toBeGreaterThan(0);
    }
  });
});

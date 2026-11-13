import type { ChecklistItem, HealthAnswers, NeedTag } from './types';

/** Engine flags from the Health check answers. */
export function flagsFromHealth(h: HealthAnswers | undefined): SafetyContext['flags'] {
  return { insomnia: !!h?.insomnia, healthRisk: !!(h?.pregnant || h?.heart || h?.ill) };
}

/** What the engine knows about the user when filtering. */
export interface SafetyContext {
  symptoms: NeedTag[];
  flags?: {
    /** R01: reports insomnia / trouble falling asleep. */
    insomnia?: boolean;
    /** R05: resistance training in the last 6–8 h. */
    resistanceTrainingWithin8h?: boolean;
    /** R06: viral illness, pregnancy or heart condition (self-report). */
    healthRisk?: boolean;
    /** R13: trip length in days. */
    tripDays?: number;
  };
}

export interface SafetyRule {
  code: string;
  /** Plain description (docs/engine-spec.md section 3-C). */
  description: string;
  /** Returns true when the item must NOT be offered. */
  blocks: (item: ChecklistItem, ctx: SafetyContext) => boolean;
}

/**
 * Rules that remove items from suggestions. Rules that only change numbers or show info
 * (R02, R03, R07–R12) do not block an item, so they are not here; their numbers live in item params.
 */
export const SAFETY_RULES: SafetyRule[] = [
  {
    code: 'R01',
    description: 'Insomnia or trouble falling asleep blocks napping (SL07).',
    blocks: (item, ctx) => item.id === 'SL07' && !!ctx.flags?.insomnia,
  },
  {
    code: 'R05',
    description: 'Resistance training in the last 6–8 h blocks cold exposure (ST02).',
    blocks: (item, ctx) => item.id === 'ST02' && !!ctx.flags?.resistanceTrainingWithin8h,
  },
  {
    code: 'R06',
    description: 'Viral illness, pregnancy or heart condition blocks cold exposure (ST02) and hard cardio (EX03, "health lock" in engine-spec 3-B).',
    blocks: (item, ctx) => (item.id === 'ST02' || item.id.startsWith('EX03')) && !!ctx.flags?.healthRisk,
  },
  {
    code: 'R13',
    description: 'Trips shorter than 2 days hide the jet-lag sheet (SL15).',
    blocks: (item, ctx) => item.id === 'SL15' && ctx.flags?.tripDays !== undefined && ctx.flags.tripDays < 2,
  },
  {
    code: 'R14',
    description: 'If "Skipping meals" is picked, "work fasted" (FM01f) is never offered.',
    blocks: (item, ctx) => item.id === 'FM01f' && ctx.symptoms.includes('meals'),
  },
  {
    code: 'R15',
    description: 'Expressive writing (PG03) and grief reframing (PG04) are never offered automatically.',
    blocks: (item) => item.id.startsWith('PG03') || item.id.startsWith('PG04'),
  },
  {
    code: 'R16',
    description: 'Supplements, prescription drugs and other library-only items are never offered.',
    blocks: (item) => item.kind === 'library' || item.safety_rules.includes('R16'),
  },
];

// Data model. Based on docs/engine-spec.md section 4 (ChecklistItem) plus the Figma fields
// `versions` and `tiny_version`.

export type Area = 'Movement' | 'Nutrition' | 'Sleep' | 'Mind';
export const AREAS: Area[] = ['Movement', 'Nutrition', 'Sleep', 'Mind'];

/** The 8 onboarding symptoms (need tags). Labels live in src/i18n/en.json -> symptoms. */
export type NeedTag = 'msk' | 'fog' | 'sleep' | 'energy' | 'meals' | 'time' | 'stress' | 'eyes';
export const NEED_TAGS: NeedTag[] = ['msk', 'fog', 'sleep', 'energy', 'meals', 'time', 'stress', 'eyes'];

/** patch = daily tick inside a Sprint; task = one-off; tool = in-the-moment, no Sprint slot;
 *  library = read-only card; stack = bundle of items; nudge = reminder only. */
export type ItemKind = 'patch' | 'task' | 'tool' | 'library' | 'stack' | 'nudge';

export type Slot = 'MORNING' | 'DESK' | 'LUNCH' | 'EVENING' | 'BEDTIME';
export type Tier = 'free' | 'pro';
export type Level = 1 | 2 | 3;

/** Glyph names of the IconTile component. */
export type Glyph = 'Move' | 'Walk' | 'Nutrition' | 'Water' | 'Sleep' | 'Light' | 'Coffee' | 'Mind' | 'Breathe';

/** Tab names read from Figma Patch detail (2033:2855): Tiny / Standard / Stretch. */
export type VersionKey = 'tiny' | 'standard' | 'stretch';

export interface PatchVersion {
  /** Short time label shown on the VersionTab, e.g. "20 s", "5 min". */
  time: string;
  /** What to do, one or two short sentences. */
  text: string;
}

/** When an item happens in the day (docs/engine-spec.md section 4, `trigger`).
 *  Offsets are minutes from the anchor; negative means before bed. */
export interface Trigger {
  anchor: 'wake' | 'bed' | 'meal' | 'sit_timer';
  offset_min: number;
  offset_max?: number;
  /** The time is a last moment ("until"), not when to do it. E.g. caffeine cutoff. */
  cutoff?: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  kind: ItemKind;
  area: Area;
  needs: NeedTag[];
  level: Level;
  tier: Tier;
  slot: Slot;
  trigger?: Trigger;
  /** Minutes of the Standard version. Used for Q (<= 5 min) and the ~12 min/day cap. */
  duration_min: number;
  /** Raw numbers from docs/engine-spec.md. Display text is built from these. */
  params: Record<string, unknown>;
  safety_rules: string[];
  /** Book protocol ids this item comes from (e.g. SL01 also covers LI01). */
  sources: string[];
  /** null until the PubMed review is done (engine uses E = 0.5). */
  evidence_level: null | 'strong' | 'moderate' | 'low' | 'uncertain';
  science_note: string;
  glyph: Glyph;
  versions: Record<VersionKey, PatchVersion>;
  /** About 20 seconds. Shown in the Busy day sheet. */
  tiny_version: string;
  /** Open questions about this item's numbers or text. */
  todo?: string[];
}

/** Self-reported health answers (onboarding Health check). Used by safety rules R01 and R06. */
export interface HealthAnswers {
  pregnant?: boolean;
  heart?: boolean;
  ill?: boolean;
  /** Trouble falling asleep (R01). */
  insomnia?: boolean;
}

export type SprintTheme = 'Morning basics' | 'Move more' | 'Eat on time' | 'Sleep base' | 'Calm focus';

export interface Sprint {
  number: number;
  /** Picked from the patches by engine/theme.ts. */
  theme: SprintTheme | null;
  length_days: 14;
  patch_ids: string[];
  started_at: string;
}

// Programs (owner decision): curated 3-week paths, one Sprint per week, 3 patches each.
// Built only from existing patches (numbers and text come from the book via items.json).
// The first program is free and uses Level 1 patches only; the others are Pro.

export interface ProgramWeek { patch_ids: string[] }
export interface Program {
  id: string;
  /** Free for everyone; otherwise Pro. */
  free: boolean;
  glyph: 'Sleep' | 'Move' | 'Light' | 'Mind';
  weeks: ProgramWeek[];
}

export const PROGRAMS: Program[] = [
  {
    id: 'sleep',
    free: true,
    glyph: 'Sleep',
    weeks: [
      { patch_ids: ['SL01', 'SL11b', 'NU02a'] },
      { patch_ids: ['SL01', 'SL11a', 'SL04'] },
      { patch_ids: ['SL04', 'SL11a', 'ST04'] },
    ],
  },
  {
    id: 'desk',
    free: false,
    glyph: 'Move',
    weeks: [
      { patch_ids: ['EX01d', 'EX01c', 'FM05'] },
      { patch_ids: ['EX01b', 'EX04', 'NU02b'] },
      { patch_ids: ['EX01a', 'EX04', 'PG02b'] },
    ],
  },
  {
    id: 'energy',
    free: false,
    glyph: 'Light',
    weeks: [
      { patch_ids: ['SL01', 'NU02a', 'SL11b'] },
      { patch_ids: ['EX01b', 'NU03a', 'SL02'] },
      { patch_ids: ['EX01a', 'NU01a', 'SL14'] },
    ],
  },
  {
    id: 'calm',
    free: false,
    glyph: 'Mind',
    weeks: [
      { patch_ids: ['ST04', 'PG02a', 'FM05'] },
      { patch_ids: ['PG01a', 'PG02b', 'SL14'] },
      { patch_ids: ['PG01b', 'PG02c', 'SL03'] },
    ],
  },
];

export const getProgram = (id: string) => PROGRAMS.find((p) => p.id === id);

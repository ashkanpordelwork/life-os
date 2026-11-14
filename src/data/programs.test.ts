import { describe, expect, it } from 'vitest';
import { getItem } from '.';
import { PROGRAMS } from './programs';

describe('programs', () => {
  it('every week has 3 real patches', () => {
    for (const p of PROGRAMS) for (const w of p.weeks) {
      expect(w.patch_ids).toHaveLength(3);
      for (const id of w.patch_ids) expect(getItem(id)?.kind, `${p.id}: ${id}`).toBe('patch');
    }
  });
  it('the free program uses Level 1 patches only', () => {
    for (const p of PROGRAMS.filter((x) => x.free)) for (const w of p.weeks) for (const id of w.patch_ids) expect(getItem(id)!.level).toBe(1);
  });
  it('no program needs the health lock', () => {
    for (const p of PROGRAMS) for (const w of p.weeks) for (const id of w.patch_ids) expect(getItem(id)!.safety_rules).not.toContain('health_lock');
  });
});

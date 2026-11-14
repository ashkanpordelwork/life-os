import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Owner rule: never cut a card's shadow. See CLAUDE.md, UI rules.
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

describe('shadow rules', () => {
  const src = join(__dirname, '..');
  const tsx = files(src).filter((f) => f.endsWith('.tsx'));

  it('no inline overflow hidden wrappers (use <Collapse> instead)', () => {
    const bad = tsx.filter((f) => /overflow:\s*'hidden'/.test(readFileSync(f, 'utf8')) && !f.endsWith('Collapse.tsx'));
    expect(bad).toEqual([]);
  });

  it('scroll boxes that hold cards give their shadows room', () => {
    const css = files(src).filter((f) => f.endsWith('.css'));
    const scrollers = css.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/\.([\w-]+)\s*\{[^}]*overflow-y:\s*auto/g)].map((m) => m[1]));
    for (const cls of scrollers) {
      const used = tsx.map((f) => readFileSync(f, 'utf8')).filter((s) => s.includes(cls));
      for (const s of used) expect(s.includes(`${cls} shadow-room`), `${cls} needs shadow-room`).toBe(true);
    }
  });
});

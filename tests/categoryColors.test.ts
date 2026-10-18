import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLOR_CLASSES,
  CATEGORY_LABEL_CLASSES,
  categoryColorClass,
  categoryLabelClass,
} from '../utils/categoryColors';

/** Every class the `@source inline("bg-{a,b}-{500,700}")` line in index.css makes Tailwind emit. */
function inlineSourceClasses(): Set<string> {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  const line = css.match(/@source inline\("([^"]+)"\)/);
  if (!line) return new Set();
  const groups = [...line[1].matchAll(/\{([^}]+)\}/g)].map((m) => m[1].split(','));
  const [prefix] = line[1].split('{');
  const out = new Set<string>();
  for (const hue of groups[0] ?? []) for (const shade of groups[1] ?? []) out.add(`${prefix}${hue}-${shade}`);
  return out;
}

describe('category colours', () => {
  it('labels use the -700 shade of the same hue, so white text keeps 4.5:1', () => {
    expect(categoryLabelClass('bg-orange-500')).toBe('bg-orange-700');
    expect(categoryLabelClass('bg-brand-500')).toBe('bg-brand-700');
  });

  it('an unknown or hand-edited value falls back to the brand colour', () => {
    expect(categoryColorClass('bg-[#123456]')).toBe('bg-brand-500');
    expect(categoryLabelClass(undefined)).toBe('bg-brand-700');
  });

  it('every dot and label class is compiled: index.css lists each one', () => {
    // Stored as data, the classes never appear whole in source; unlisted, they render transparent
    const compiled = inlineSourceClasses();
    expect(CATEGORY_LABEL_CLASSES).toHaveLength(CATEGORY_COLOR_CLASSES.length);
    for (const cls of [...CATEGORY_COLOR_CLASSES, ...CATEGORY_LABEL_CLASSES]) {
      expect(compiled, cls).toContain(cls);
    }
  });
});

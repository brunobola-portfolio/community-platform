import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLOR_CLASSES,
  CATEGORY_LABEL_CLASSES,
  categoryColorClass,
  categoryLabelClass,
} from '../utils/categoryColors';

describe('category colours', () => {
  it('labels use the -700 shade of the same hue, so white text keeps 4.5:1', () => {
    expect(categoryLabelClass('bg-orange-500')).toBe('bg-orange-700');
    expect(categoryLabelClass('bg-brand-500')).toBe('bg-brand-700');
  });

  it('an unknown or hand-edited value falls back to the brand colour', () => {
    expect(categoryColorClass('bg-[#123456]')).toBe('bg-brand-500');
    expect(categoryLabelClass(undefined)).toBe('bg-brand-700');
  });

  it('every label shade is safelisted next to its dot shade', () => {
    // Stored as data, the classes never appear in source; outside the safelist they render transparent
    expect(CATEGORY_LABEL_CLASSES).toHaveLength(CATEGORY_COLOR_CLASSES.length);
    for (const dot of CATEGORY_COLOR_CLASSES) {
      expect(CATEGORY_LABEL_CLASSES).toContain(categoryLabelClass(dot));
    }
  });
});

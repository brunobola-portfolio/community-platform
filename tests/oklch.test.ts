import { describe, expect, it } from 'vitest';
import { hexToRgb, rgbToHex } from '../utils/color';
import { clampChroma, hueDistance, isInGamut, oklchToRgb, rgbToOklch } from '../utils/oklch';

describe('oklch conversions', () => {
  it('matches reference OKLCH values', () => {
    const red = rgbToOklch(hexToRgb('#ff0000'));
    expect(red.l).toBeCloseTo(0.628, 3);
    expect(red.c).toBeCloseTo(0.2577, 3);
    expect(red.h).toBeCloseTo(29.23, 1);
    expect(rgbToOklch(hexToRgb('#ffffff')).l).toBeCloseTo(1, 4);
    expect(rgbToOklch(hexToRgb('#000000')).l).toBeCloseTo(0, 4);
  });

  it('treats greys as achromatic with a stable hue', () => {
    for (const hex of ['#000000', '#808080', '#ffffff', '#111111']) {
      const lch = rgbToOklch(hexToRgb(hex));
      expect(lch.c).toBe(0);
      expect(lch.h).toBe(0);
    }
  });

  it.each(['#df3d32', '#4f46e5', '#0f766e', '#eab308', '#ffff00', '#0000ff', '#00ff00', '#123456', '#fefefe'])(
    'round-trips %s byte for byte',
    (hex) => {
      expect(rgbToHex(oklchToRgb(rgbToOklch(hexToRgb(hex))))).toBe(hex);
    },
  );
});

describe('gamut clamping', () => {
  it('reduces chroma only, keeping lightness and hue', () => {
    const wanted = { l: 0.9, c: 0.35, h: 29 };
    expect(isInGamut(wanted)).toBe(false);
    const clamped = clampChroma(wanted);
    expect(isInGamut(clamped)).toBe(true);
    expect(clamped.l).toBe(0.9);
    expect(clamped.h).toBe(29);
    expect(clamped.c).toBeLessThan(0.35);
    expect(clamped.c).toBeGreaterThan(0.03);
    // The rendered colour keeps the hue too
    expect(hueDistance(rgbToOklch(oklchToRgb(wanted)).h, 29)).toBeLessThan(3);
  });

  it('leaves in-gamut colours alone and clamps lightness to 0…1', () => {
    const inside = { l: 0.6, c: 0.1, h: 200 };
    expect(clampChroma(inside)).toEqual(inside);
    expect(oklchToRgb({ l: 1.4, c: 0, h: 0 })).toEqual([255, 255, 255]);
    expect(oklchToRgb({ l: -0.2, c: 0.2, h: 0 })).toEqual([0, 0, 0]);
  });

  it('measures hue distance on the circle', () => {
    expect(hueDistance(350, 10)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
    expect(hueDistance(90, 90)).toBe(0);
  });
});

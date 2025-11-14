// src/domain/__tests__/types.test.ts

import { isBeadColor, isBeadPalette } from '../colors';
import type { BeadColor, BeadPalette } from '../colors';

describe('color type guards', () => {
  const validColor: BeadColor = {
    id: 'c1',
    name: 'Red',
    paletteId: 'p1',
    rgb: { r: 255, g: 0, b: 0 },
  };

  const validPalette: BeadPalette = {
    id: 'p1',
    name: 'Test Palette',
    colors: [validColor],
  };

  it('recognizes a valid BeadColor', () => {
    expect(isBeadColor(validColor)).toBe(true);
  });

  it('rejects an invalid BeadColor', () => {
    const invalid: any = { ...validColor, rgb: { r: '255', g: 0, b: 0 } };
    expect(isBeadColor(invalid)).toBe(false);
  });

  it('recognizes a valid BeadPalette', () => {
    expect(isBeadPalette(validPalette)).toBe(true);
  });

  it('rejects an invalid BeadPalette', () => {
    const invalid: any = { id: 'p2', name: 'Broken', colors: 'not-an-array' };
    expect(isBeadPalette(invalid)).toBe(false);
  });
});
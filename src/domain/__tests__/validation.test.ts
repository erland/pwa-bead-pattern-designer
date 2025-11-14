// src/domain/__tests__/validation.test.ts

import { createEmptyGrid, type BeadPattern } from '../patterns';
import { isPatternGridRectangular, isPatternCompatibleWithShape } from '../validation';
import type { PegboardShape } from '../shapes';

function makePattern(cols: number, rows: number): BeadPattern {
  const now = new Date().toISOString();
  return {
    id: 'p1',
    name: 'Test Pattern',
    shapeId: 'shape-1',
    cols,
    rows,
    paletteId: 'palette-1',
    grid: createEmptyGrid(cols, rows),
    createdAt: now,
    updatedAt: now,
  };
}

function makeShape(cols: number, rows: number): PegboardShape {
  return {
    id: 'shape-1',
    name: 'Rect',
    kind: 'rectangle',
    cols,
    rows,
  };
}

describe('pattern grid validation', () => {
  it('accepts a correctly sized rectangular grid', () => {
    const pattern = makePattern(4, 3);
    expect(isPatternGridRectangular(pattern)).toBe(true);
  });

  it('rejects a grid with wrong row count', () => {
    const pattern = makePattern(4, 3);
    // remove one row
    pattern.grid.pop();
    expect(isPatternGridRectangular(pattern)).toBe(false);
  });

  it('rejects a grid with inconsistent row length', () => {
    const pattern = makePattern(4, 3);
    // make last row length 2 instead of 4
    pattern.grid[2] = [null, null];
    expect(isPatternGridRectangular(pattern)).toBe(false);
  });

  it('accepts compatible shape dimensions', () => {
    const pattern = makePattern(10, 10);
    const shape = makeShape(10, 10);
    expect(isPatternCompatibleWithShape(pattern, shape)).toBe(true);
  });

  it('rejects incompatible shape dimensions', () => {
    const pattern = makePattern(10, 10);
    const shape = makeShape(8, 10);
    expect(isPatternCompatibleWithShape(pattern, shape)).toBe(false);
  });
});
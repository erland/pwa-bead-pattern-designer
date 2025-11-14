// src/domain/validation.ts

import type { BeadPattern } from './patterns';
import type { PegboardShape } from './shapes';

/**
 * Validate that the pattern grid matches its declared cols/rows.
 * - grid length === rows
 * - each row length === cols
 */
export function isPatternGridRectangular(pattern: BeadPattern): boolean {
  const { cols, rows, grid } = pattern;

  if (grid.length !== rows) {
    return false;
  }

  for (let y = 0; y < rows; y += 1) {
    const row = grid[y];
    if (!Array.isArray(row) || row.length !== cols) {
      return false;
    }
  }

  return true;
}

/**
 * Validate that pattern dimensions are compatible with a given shape.
 * For now, this just compares cols/rows; mask-level enforcement is done in rendering.
 */
export function isPatternCompatibleWithShape(
  pattern: BeadPattern,
  shape: PegboardShape,
): boolean {
  return pattern.cols === shape.cols && pattern.rows === shape.rows;
}
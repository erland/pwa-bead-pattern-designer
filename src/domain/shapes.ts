// src/domain/shapes.ts

/** Supported pegboard shape kinds. */
export type PegboardShapeKind = 'square' | 'rectangle' | 'circle' | 'hexagon' | 'heart' | 'star';

/**
 * PegboardShape describes the physical pegboard geometry.
 * `cols` and `rows` define the bounding rectangle for the shape.
 * `mask` optionally defines which cells are "valid" (true) or disabled (false).
 */
export interface PegboardShape {
  id: string;
  name: string;
  kind: PegboardShapeKind;
  cols: number;
  rows: number;
  /**
   * Optional mask of valid cells.
   * mask[y][x] === true means this cell is part of the shape.
   * If omitted, all cells are considered valid.
   */
  mask?: boolean[][];
}

/** Utility: test if a cell is valid within a given shape. */
export function isCellInShape(shape: PegboardShape, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= shape.cols || y >= shape.rows) {
    return false;
  }

  if (!shape.mask) {
    return true;
  }

  const row = shape.mask[y];
  if (!row) return false;
  return Boolean(row[x]);
}
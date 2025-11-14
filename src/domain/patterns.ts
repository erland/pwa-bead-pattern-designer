// src/domain/patterns.ts

import type { BeadColorId } from './colors';

/** Serializable timestamp (ISO-8601) for persistence friendliness. */
export type IsoTimestamp = string;

/**
 * 2D bead pattern model.
 * `grid[y][x]` holds a BeadColorId or null (empty cell).
 */
export interface BeadPattern {
  id: string;
  name: string;

  /** Pegboard shape id this pattern is designed for. */
  shapeId: string;

  /** Logical width/height in cells (should match the shape dimensions). */
  cols: number;
  rows: number;

  /** Palette id used for this pattern. */
  paletteId: string;

  /** Pattern grid, row-major: grid[row][col]. */
  grid: (BeadColorId | null)[][];

  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** An individual part used in a multi-part 3D PatternGroup. */
export interface PatternPart {
  id: string;
  name: string;
  /** For now, reference an external pattern by id. */
  patternId: string;
}

/** Optional assembly metadata for 3D groups (can be refined later). */
export interface AssemblyMetadata {
  /** Optional free-text notes for assembly. */
  notes?: string;
  /** Arbitrary extra structured fields can be added later. */
  [key: string]: unknown;
}

/** Group of patterns that form a 3D model. */
export interface PatternGroup {
  id: string;
  name: string;
  parts: PatternPart[];
  assemblyMetadata?: AssemblyMetadata;
}

/** Simple helper: create a new empty grid with given dimensions. */
export function createEmptyGrid(cols: number, rows: number): (BeadColorId | null)[][] {
  const grid: (BeadColorId | null)[][] = [];
  for (let y = 0; y < rows; y += 1) {
    const row: (BeadColorId | null)[] = [];
    for (let x = 0; x < cols; x += 1) {
      row.push(null);
    }
    grid.push(row);
  }
  return grid;
}
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

  // 🆕 Ownership flags – when set, this pattern is considered "embedded"
  // and should not appear in the top-level Patterns list on Home.
  belongsToGroupId?: string | null;
  belongsToPartId?: string | null;
  
  /** Pattern grid, row-major: grid[row][col]. */
  grid: (BeadColorId | null)[][];

  /** New: which colors from the global catalog are available in this pattern. */
  activeColorIds?: BeadColorId[];
  
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

// ─────────────────────────────────────────────────────────────
// Dimension guides (group-level, used for visual wall height/width)
// ─────────────────────────────────────────────────────────────

export type DimensionGuideAxis = 'horizontal' | 'vertical';
export type DimensionGuideReference = 'top' | 'bottom' | 'left' | 'right';

export interface DimensionGuide {
  id: string;
  label: string;
  axis: DimensionGuideAxis;
  /**
   * From which board edge we measure this guide.
   * - horizontal + top/bottom
   * - vertical + left/right
   */
  reference: DimensionGuideReference;
  /** Number of cells from the reference edge. */
  cells: number;
}

/** Optional assembly metadata for 3D groups (can be refined later). */
export interface AssemblyMetadata {
  /** Optional free-text notes for assembly. */
  notes?: string;

  /** Group-level dimension guides for visual alignment. */
  dimensionGuides?: DimensionGuide[];

  /** Arbitrary extra structured fields can be added later. */
  [key: string]: unknown;
}

/** Group of patterns that form a 3D model. */
export interface PatternGroup {
  id: string;
  name: string;
  parts: PatternPart[];

  /** If true, this group is shown in the "New from Template" dialog. */
  isTemplate?: boolean;
  
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

/**
 * Compute how many beads of each color id are used in a pattern.
 */
export function computeBeadCounts(pattern: BeadPattern): Record<BeadColorId, number> {
  const counts: Record<BeadColorId, number> = {};
  for (let y = 0; y < pattern.rows; y += 1) {
    const row = pattern.grid[y];
    if (!row) continue;
    for (let x = 0; x < pattern.cols; x += 1) {
      const colorId = row[x];
      if (!colorId) continue;
      counts[colorId] = (counts[colorId] ?? 0) + 1;
    }
  }
  return counts;
}
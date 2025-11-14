// src/editor/tools.ts
import type { BeadColorId } from '../domain/colors';

export type BeadGrid = (BeadColorId | null)[][];

/** Deep clone a bead grid. */
export function cloneGrid(grid: BeadGrid): BeadGrid {
  return grid.map((row) => row.slice());
}

/** Pencil: set a single cell to selected color. */
export function applyPencil(grid: BeadGrid, x: number, y: number, colorId: BeadColorId): BeadGrid {
  const next = cloneGrid(grid);
  if (!next[y]) return next;
  next[y][x] = colorId;
  return next;
}

/** Eraser: set a single cell to empty (null). */
export function applyEraser(grid: BeadGrid, x: number, y: number): BeadGrid {
  const next = cloneGrid(grid);
  if (!next[y]) return next;
  next[y][x] = null;
  return next;
}

/**
 * Flood fill: replace the contiguous region containing (x, y)
 * (all cells with the same original value) with newColor.
 */
export function applyFill(grid: BeadGrid, x: number, y: number, newColor: BeadColorId): BeadGrid {
  const rows = grid.length;
  if (rows === 0) return grid;
  const cols = grid[0].length;
  if (x < 0 || y < 0 || x >= cols || y >= rows) return grid;

  const target = grid[y]?.[x] ?? null;
  // Nothing to do if already the desired color
  if (target === newColor) return grid;

  const next = cloneGrid(grid);

  const queue: Array<{ x: number; y: number }> = [{ x, y }];
  const visited = new Set<string>();

  const key = (cx: number, cy: number) => `${cx},${cy}`;

  while (queue.length > 0) {
    const { x: cx, y: cy } = queue.shift()!;
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
    const k = key(cx, cy);
    if (visited.has(k)) continue;
    visited.add(k);

    if ((next[cy]?.[cx] ?? null) !== target) continue;

    // Fill this cell
    next[cy][cx] = newColor;

    // 4-way neighbours
    queue.push({ x: cx + 1, y: cy });
    queue.push({ x: cx - 1, y: cy });
    queue.push({ x: cx, y: cy + 1 });
    queue.push({ x: cx, y: cy - 1 });
  }

  return next;
}
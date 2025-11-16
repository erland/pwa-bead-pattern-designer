// src/editor/tools.ts
import type { BeadColorId } from '../domain/colors';

/**
 * A 2D bead grid. Index as grid[y][x].
 */
export type BeadGrid = (BeadColorId | null)[][];

/**
 * Axis-aligned rectangle in cell coordinates.
 * x,y are inclusive top-left; width/height are >= 0.
 */
export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Deep clone a bead grid. */
export function cloneGrid(grid: BeadGrid): BeadGrid {
  return grid.map((row) => row.slice());
}

/** Pencil: set a single cell to selected color.. */
export function applyPencil(grid: BeadGrid, x: number, y: number, colorId: BeadColorId): BeadGrid {
  const next = cloneGrid(grid);
  if (!next[y] || x < 0 || x >= next[y].length) return next;
  next[y][x] = colorId;
  return next;
}

/** Eraser: clear a single cell to null. */
export function applyEraser(grid: BeadGrid, x: number, y: number): BeadGrid {
  const next = cloneGrid(grid);
  if (!next[y] || x < 0 || x >= next[y].length) return next;
  next[y][x] = null;
  return next;
}

/**
 * Flood fill a connected area starting at (startX,startY) with newColor.
 * Uses 4-way connectivity. If the starting cell is already newColor,
 * returns the ORIGINAL grid reference (for cheap no-op).
 */
export function applyFill(
  grid: BeadGrid,
  startX: number,
  startY: number,
  newColor: BeadColorId | null,
): BeadGrid {
  const target = grid[startY]?.[startX] ?? null;

  // Nothing to do if target is already the same colour.
  if (target === newColor) {
    return grid;
  }

  const next = cloneGrid(grid);
  const rows = next.length;
  if (rows === 0) return next;
  const cols = next[0].length;

  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const { x, y } = queue.pop()!;
    if (y < 0 || y >= rows) continue;
    if (x < 0 || x >= cols) continue;

    if ((next[y]?.[x] ?? null) !== target) continue;

    // Fill this cell
    next[y][x] = newColor;

    // 4-way neighbours
    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }

  return next;
}

/**
 * Normalise two corner points into a well-formed CellRect with positive width/height.
 */
export function normaliseRect(x0: number, y0: number, x1: number, y1: number): CellRect {
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const right = Math.max(x0, x1);
  const bottom = Math.max(y0, y1);
  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

/**
 * Clamp a rect so it stays within the bounds of the grid.
 * If the rect ends up empty, width/height will be 0.
 */
export function clampRectToGrid(grid: BeadGrid, rect: CellRect): CellRect {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(cols - 1, rect.x + rect.width - 1);
  const y1 = Math.min(rows - 1, rect.y + rect.height - 1);

  if (x1 < x0 || y1 < y0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: x0,
    y: y0,
    width: x1 - x0 + 1,
    height: y1 - y0 + 1,
  };
}

/**
 * Copy a rectangular region out of a grid. The region is clamped to the grid.
 */
export function copyRegion(grid: BeadGrid, rect: CellRect): BeadGrid {
  const bounded = clampRectToGrid(grid, rect);
  if (bounded.width === 0 || bounded.height === 0) {
    return [];
  }

  const result: BeadGrid = [];
  for (let y = 0; y < bounded.height; y += 1) {
    const row: (BeadColorId | null)[] = [];
    const srcY = bounded.y + y;
    const srcRow = grid[srcY] ?? [];
    for (let x = 0; x < bounded.width; x += 1) {
      const srcX = bounded.x + x;
      row.push(srcRow[srcX] ?? null);
    }
    result.push(row);
  }

  return result;
}

/**
 * Clear (set to null) all cells within the given rect.
 */
export function clearRegion(grid: BeadGrid, rect: CellRect): BeadGrid {
  const next = cloneGrid(grid);
  const bounded = clampRectToGrid(next, rect);
  if (bounded.width === 0 || bounded.height === 0) {
    return next;
  }

  for (let dy = 0; dy < bounded.height; dy += 1) {
    const y = bounded.y + dy;
    const row = next[y];
    if (!row) continue;
    for (let dx = 0; dx < bounded.width; dx += 1) {
      const x = bounded.x + dx;
      if (x < 0 || x >= row.length) continue;
      row[x] = null;
    }
  }

  return next;
}

/**
 * Paste a region into the grid with its top-left corner at (targetX, targetY).
 * Cells that fall outside the grid bounds are ignored.
 */
export function pasteRegion(
  grid: BeadGrid,
  targetX: number,
  targetY: number,
  region: BeadGrid,
): BeadGrid {
  const next = cloneGrid(grid);
  const rows = next.length;
  const cols = rows > 0 ? next[0].length : 0;

  for (let ry = 0; ry < region.length; ry += 1) {
    const srcRow = region[ry];
    const destY = targetY + ry;
    if (destY < 0 || destY >= rows) continue;
    const destRow = next[destY];
    if (!destRow) continue;

    for (let rx = 0; rx < srcRow.length; rx += 1) {
      const destX = targetX + rx;
      if (destX < 0 || destX >= cols) continue;
      destRow[destX] = srcRow[rx];
    }
  }

  return next;
}

/**
 * Move a region by (dx, dy).
 * Internally does copy → clear → paste so it can integrate nicely with history.
 */
export function moveRegion(grid: BeadGrid, rect: CellRect, dx: number, dy: number): BeadGrid {
  if (rect.width === 0 || rect.height === 0) return grid;
  const region = copyRegion(grid, rect);
  const cleared = clearRegion(grid, rect);
  return pasteRegion(cleared, rect.x + dx, rect.y + dy, region);
}

/**
 * Replace all occurrences of fromColor with toColor in the grid.
 * If fromColor === toColor, returns the original grid reference.
 */
export function replaceColor(
  grid: BeadGrid,
  fromColor: BeadColorId | null,
  toColor: BeadColorId | null,
): BeadGrid {
  if (fromColor === toColor) return grid;

  let changed = false;
  const next: BeadGrid = grid.map((row) =>
    row.map((cell) => {
      if (cell === fromColor) {
        changed = true;
        return toColor;
      }
      return cell;
    }),
  );

  return changed ? next : grid;
}

/**
 * Mirror the pattern horizontally (left-right).
 * Returns a new grid; original is unchanged.
 */
export function mirrorGridHorizontally(grid: BeadGrid): BeadGrid {
  return grid.map((row) => {
    const copy = row.slice();
    copy.reverse();
    return copy;
  });
}

/**
 * Mirror the pattern vertically (top-bottom).
 * Returns a new grid; original is unchanged.
 */
export function mirrorGridVertically(grid: BeadGrid): BeadGrid {
  const copy = grid.slice().reverse();
  return copy.map((row) => row.slice());
}
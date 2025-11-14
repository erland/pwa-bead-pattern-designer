// src/domain/shapes.ts

/** Supported pegboard shape kinds. */
export type PegboardShapeKind =
  | 'square'
  | 'rectangle'
  | 'circle'
  | 'hexagon'
  | 'heart'
  | 'star';

/** Boolean mask for valid cells: mask[y][x] = true | false. */
export type PegboardMask = boolean[][];

/**
 * PegboardShape describes the physical pegboard geometry.
 * `cols` and `rows` define the bounding rectangle for the shape.
 * `mask` optionally defines which cells are "valid" (true) or disabled (false).
 *
 * If `mask` is undefined, every cell in the cols×rows rectangle is valid.
 */
export interface PegboardShape {
  id: string;
  name: string;
  kind: PegboardShapeKind;
  cols: number;
  rows: number;
  mask?: PegboardMask;
}

/** Internal helper: create an empty mask. */
function createMask(cols: number, rows: number, initial = false): PegboardMask {
  const mask: PegboardMask = [];
  for (let y = 0; y < rows; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < cols; x += 1) {
      row.push(initial);
    }
    mask.push(row);
  }
  return mask;
}

/**
 * Simple rectangle (or square) shape.
 * If `withMask` is false, `mask` is left undefined (meaning "all valid").
 */
export function createRectangleShape(
  id: string,
  name: string,
  cols: number,
  rows: number,
  withMask = false,
): PegboardShape {
  const kind: PegboardShapeKind = cols === rows ? 'square' : 'rectangle';

  if (!withMask) {
    return { id, name, kind, cols, rows };
  }

  const mask = createMask(cols, rows, true);
  return { id, name, kind, cols, rows, mask };
}

/**
 * Circle-ish pegboard: radial mask inside a bounding square.
 * This is an approximation, good enough for a bead board.
 */
export function createCircleShape(id: string, name: string, diameter: number): PegboardShape {
  const cols = diameter;
  const rows = diameter;
  const mask = createMask(cols, rows, false);

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const r = diameter / 2;

  const r2 = r * r;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      // allow a small margin so we don't get a jagged ring
      if (dist2 <= r2 + 0.4) {
        mask[y][x] = true;
      }
    }
  }

  return {
    id,
    name,
    kind: 'circle',
    cols,
    rows,
    mask,
  };
}

/**
 * Very simple hexagon approximation inside a rectangle.
 * Uses "Manhattan-like" distance to create a hex-ish footprint.
 */
export function createHexagonShape(
  id: string,
  name: string,
  cols: number,
  rows: number,
): PegboardShape {
  const mask = createMask(cols, rows, false);

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxRadius = Math.min(cols, rows) / 2;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      // Very rough hex: squashed diamond-ish
      if (dx + dy * 0.7 <= maxRadius) {
        mask[y][x] = true;
      }
    }
  }

  return {
    id,
    name,
    kind: 'hexagon',
    cols,
    rows,
    mask,
  };
}

/**
 * Heart shape using a classic implicit heart equation,
 * normalised into the grid.
 */
export function createHeartShape(id: string, name: string, size: number): PegboardShape {
  const cols = size;
  const rows = size;
  const mask = createMask(cols, rows, false);

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const scale = size / 2.4;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const nx = (x - cx) / scale;
      const ny = (y - cy) / scale;

      // (x^2 + y^2 - 1)^3 - x^2 y^3 <= 0 is inside the heart
      const a = nx * nx + ny * ny - 1;
      const value = a * a * a - nx * nx * ny * ny * ny;
      if (value <= 0) {
        mask[y][x] = true;
      }
    }
  }

  return {
    id,
    name,
    kind: 'heart',
    cols,
    rows,
    mask,
  };
}

/**
 * Very naive star-shaped mask: five-point star approximated from a
 * central radius and spikes. This is intentionally simple.
 */
export function createStarShape(id: string, name: string, size: number): PegboardShape {
  const cols = size;
  const rows = size;
  const mask = createMask(cols, rows, false);

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const outerR = size / 2;
  const innerR = outerR * 0.45;
  const points = 5;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > outerR) continue;

      const angle = Math.atan2(dy, dx);
      const sector = ((angle + Math.PI) / (2 * Math.PI)) * points;
      const distToArmCenter = Math.abs(sector - Math.round(sector));

      // If we're close to one of the radial "arms" and within radius band,
      // mark as valid. This isn't mathematically exact, but looks star-ish.
      if (distToArmCenter < 0.25 && r >= innerR && r <= outerR) {
        mask[y][x] = true;
      } else if (r < innerR * 0.9 && distToArmCenter < 0.45) {
        // Fill the centre a bit so it doesn't look too hollow
        mask[y][x] = true;
      }
    }
  }

  return {
    id,
    name,
    kind: 'star',
    cols,
    rows,
    mask,
  };
}

/** Utility: test if a cell is valid within a given shape. */
export function isCellInShape(shape: PegboardShape, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= shape.cols || y >= shape.rows) {
    return false;
  }

  if (!shape.mask) {
    // No mask = all cells are valid
    return true;
  }

  const row = shape.mask[y];
  if (!row) return false;
  return Boolean(row[x]);
}

/**
 * Optional convenience: some default shapes you can seed in the store.
 * (You can choose to use these or keep your own list in beadStore.)
 */
export const DEFAULT_SHAPES: PegboardShape[] = [
  createRectangleShape('square-29', 'Square 29×29', 29, 29),
  createCircleShape('circle-29', 'Circle 29', 29),
  createHeartShape('heart-29', 'Heart (approx)', 29),
];
// src/domain/imageConversion.ts
//
// Pure image → bead grid conversion utilities used by the Image-to-Pattern
// converter page. These functions are intentionally DOM/React-free except
// for relying on the standard `ImageData` type (provided by the browser
// and by Jest's jsdom test environment).

import type { BeadColor, BeadColorId, RgbColor } from './colors';

export type DitheringMode = 'none' | 'floyd-steinberg';

export interface ImageToPatternOptions {
  cols: number;
  rows: number;
  /** Max number of distinct colors to use from the palette. `null` = unlimited. */
  maxColors: number | null;
  dithering: DitheringMode;
}

export interface ImageToPatternResult {
  grid: BeadColorId[][];
  usedColorIds: BeadColorId[];
}

/**
 * Read an RGB triplet from ImageData at (x, y).
 */
function rgbFromImageData(imageData: ImageData, x: number, y: number): RgbColor {
  const { width, data } = imageData;
  const idx = (y * width + x) * 4;
  return {
    r: data[idx] ?? 0,
    g: data[idx + 1] ?? 0,
    b: data[idx + 2] ?? 0,
  };
}

/**
 * Euclidean distance in RGB space.
 */
function rgbDistanceSq(a: RgbColor, b: RgbColor): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Find nearest palette color by Euclidean distance in RGB space.
 */
export function nearestPaletteColor(pixel: RgbColor, palette: BeadColor[]): BeadColor {
  if (palette.length === 0) {
    throw new Error('nearestPaletteColor: palette is empty');
  }

  let best = palette[0];
  let bestDist = rgbDistanceSq(pixel, best.rgb);

  for (let i = 1; i < palette.length; i += 1) {
    const candidate = palette[i];
    const dist = rgbDistanceSq(pixel, candidate.rgb);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best;
}

/**
 * Apply Floyd–Steinberg dithering while mapping to palette colors.
 *
 * Implementation note: we keep a float buffer of RGB values so we can spread
 * quantization error to neighbouring pixels. Alpha is ignored.
 */
function ditherFloydSteinberg(
  imageData: ImageData,
  palette: BeadColor[],
): BeadColorId[][] {
  const { width, height, data } = imageData;
  const buffer = new Float32Array(width * height * 3);

  // initialise buffer from original data
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    buffer[j] = data[i];
    buffer[j + 1] = data[i + 1];
    buffer[j + 2] = data[i + 2];
  }

  const grid: BeadColorId[][] = new Array(height);
  for (let y = 0; y < height; y += 1) {
    grid[y] = new Array<BeadColorId>(width);
  }

  const index = (x: number, y: number): number => (y * width + x) * 3;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = index(x, y);
      const current: RgbColor = {
        r: buffer[idx],
        g: buffer[idx + 1],
        b: buffer[idx + 2],
      };

      const nearest = nearestPaletteColor(current, palette);
      grid[y][x] = nearest.id;

      // quantization error
      const errR = current.r - nearest.rgb.r;
      const errG = current.g - nearest.rgb.g;
      const errB = current.b - nearest.rgb.b;

      // distribute error
      //   x+1, y      : 7/16
      //   x-1, y+1    : 3/16
      //   x,   y+1    : 5/16
      //   x+1, y+1    : 1/16
      const distribute = (px: number, py: number, factor: number) => {
        if (px < 0 || px >= width || py < 0 || py >= height) return;
        const di = index(px, py);
        buffer[di] += errR * factor;
        buffer[di + 1] += errG * factor;
        buffer[di + 2] += errB * factor;
      };

      distribute(x + 1, y, 7 / 16);
      distribute(x - 1, y + 1, 3 / 16);
      distribute(x, y + 1, 5 / 16);
      distribute(x + 1, y + 1, 1 / 16);
    }
  }

  return grid;
}

/**
 * Simple non-dithered mapping: each pixel is mapped independently.
 */
function mapWithoutDithering(
  imageData: ImageData,
  palette: BeadColor[],
): BeadColorId[][] {
  const { width, height } = imageData;
  const grid: BeadColorId[][] = new Array(height);

  for (let y = 0; y < height; y += 1) {
    const row: BeadColorId[] = new Array(width);
    for (let x = 0; x < width; x += 1) {
      const rgb = rgbFromImageData(imageData, x, y);
      const nearest = nearestPaletteColor(rgb, palette);
      row[x] = nearest.id;
    }
    grid[y] = row;
  }

  return grid;
}

/**
 * Reduce the number of distinct colors in `grid` to at most `maxColors`.
 * This does NOT re-run any spatial dithering; it simply remaps infrequent
 * colors to their nearest neighbour among the most-used colors.
 */
function limitColors(
  grid: BeadColorId[][],
  palette: BeadColor[],
  maxColors: number | null,
): { grid: BeadColorId[][]; usedColorIds: BeadColorId[] } {
  if (maxColors == null || maxColors <= 0) {
    // gather used colors and return as-is
    const usedSet = new Set<BeadColorId>();
    for (const row of grid) {
      for (const id of row) {
        if (id) usedSet.add(id);
      }
    }
    return { grid, usedColorIds: Array.from(usedSet) };
  }

  // count usage
  const counts = new Map<BeadColorId, number>();
  for (const row of grid) {
    for (const id of row) {
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const allColorIds = Array.from(counts.keys());
  if (allColorIds.length <= maxColors) {
    return { grid, usedColorIds: allColorIds };
  }

  // sort by frequency descending
  allColorIds.sort((a, b) => (counts.get(b)! - counts.get(a)!));

  const keepIds = new Set<BeadColorId>(allColorIds.slice(0, maxColors));
  const keptList = Array.from(keepIds);

  // build lookup from palette id → color object for quick access
  const paletteById = new Map<BeadColorId, BeadColor>();
  for (const color of palette) {
    paletteById.set(color.id, color);
  }

  // for every "dropped" color, precompute its nearest neighbour among the kept set
  const replacement = new Map<BeadColorId, BeadColorId>();
  for (const id of allColorIds) {
    if (keepIds.has(id)) continue;
    const color = paletteById.get(id);
    if (!color) continue;

    let bestId: BeadColorId | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const keepId of keepIds) {
      const keepColor = paletteById.get(keepId);
      if (!keepColor) continue;
      const dist = rgbDistanceSq(color.rgb, keepColor.rgb);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = keepId;
      }
    }
    if (bestId) {
      replacement.set(id, bestId);
    }
  }

  const outGrid: BeadColorId[][] = grid.map((row) =>
    row.map((id) => {
      if (!id) return id;
      if (keepIds.has(id)) return id;
      return replacement.get(id) ?? id;
    }),
  );

  return { grid: outGrid, usedColorIds: keptList };
}

/**
 * Convert an ImageData to a bead-id grid using the given palette and options.
 * The ImageData is assumed to already have the desired width/height in pixels,
 * corresponding 1:1 to bead cells.
 */
export function imageDataToBeadGrid(
  imageData: ImageData,
  palette: BeadColor[],
  options: ImageToPatternOptions,
): ImageToPatternResult {
  const width = imageData.width;
  const height = imageData.height;

  if (width !== options.cols || height !== options.rows) {
    // For now be strict – it keeps the mental model simple
    throw new Error(
      `imageDataToBeadGrid: ImageData size ${width}×${height} does not match options.cols/rows ${options.cols}×${options.rows}`,
    );
  }

  if (!palette.length) {
    throw new Error('imageDataToBeadGrid: palette is empty');
  }

  let grid: BeadColorId[][];
  if (options.dithering === 'floyd-steinberg') {
    grid = ditherFloydSteinberg(imageData, palette);
  } else {
    grid = mapWithoutDithering(imageData, palette);
  }

  const { grid: limitedGrid, usedColorIds } = limitColors(
    grid,
    palette,
    options.maxColors,
  );

  return {
    grid: limitedGrid,
    usedColorIds,
  };
}

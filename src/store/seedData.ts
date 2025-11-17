// src/store/seedData.ts
import type { BeadPalette, BeadColor } from '../domain/colors';
import type { BeadPattern, PatternGroup, PatternPart } from '../domain/patterns';
import { createEmptyGrid } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import { DEFAULT_SHAPES, createRectangleShape } from '../domain/shapes';

export type SeedData = {
  patterns: Record<string, BeadPattern>;
  groups: Record<string, PatternGroup>;
  palettes: Record<string, BeadPalette>;
  shapes: Record<string, PegboardShape>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Seed palette
// ─────────────────────────────────────────────────────────────────────────────

function createSeedPalette(): BeadPalette {
  const paletteId = 'palette-basic';
  const colors: BeadColor[] = [
    { id: 'c-white', name: 'White', paletteId, rgb: { r: 255, g: 255, b: 255 } },
    { id: 'c-black', name: 'Black', paletteId, rgb: { r: 0, g: 0, b: 0 } },
    { id: 'c-red', name: 'Red', paletteId, rgb: { r: 230, g: 57, b: 70 } },
    { id: 'c-green', name: 'Green', paletteId, rgb: { r: 42, g: 157, b: 143 } },
    { id: 'c-blue', name: 'Blue', paletteId, rgb: { r: 38, g: 70, b: 83 } },
    { id: 'c-yellow', name: 'Yellow', paletteId, rgb: { r: 244, g: 208, b: 63 } },
  ];

  return {
    id: paletteId,
    name: 'Basic Demo Palette',
    brand: 'Demo',
    colors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed shapes
// ─────────────────────────────────────────────────────────────────────────────

function createSeedShapes(): Record<string, PegboardShape> {
  // Keep a small 16×16 square for quick tests / tiny patterns
  const baseShapes: PegboardShape[] = [
    createRectangleShape('shape-square-16', 'Square 16×16', 16, 16),
    // And then all the default 29×29 shapes (square, circle, heart, …)
    ...DEFAULT_SHAPES,
  ];

  const map: Record<string, PegboardShape> = {};
  for (const s of baseShapes) {
    map[s.id] = s;
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed patterns & groups
// ─────────────────────────────────────────────────────────────────────────────

export function createSeedData(): SeedData {
  const palette = createSeedPalette();
  const shapes = createSeedShapes();

  const defaultShape = shapes['shape-square-16'];
  const patternId = 'pattern-demo-house-front';
  const now = new Date().toISOString();

  const pattern: BeadPattern = {
    id: patternId,
    name: 'Demo Pattern',
    shapeId: defaultShape.id,
    cols: defaultShape.cols,
    rows: defaultShape.rows,
    paletteId: palette.id,
    grid: createEmptyGrid(defaultShape.cols, defaultShape.rows),
    createdAt: now,
    updatedAt: now,
  };

  const groupId = 'group-demo-house';
  const part: PatternPart = {
    id: 'part-front-wall',
    name: 'Front Wall',
    patternId,
  };

  const group: PatternGroup = {
    id: groupId,
    name: 'Demo House',
    parts: [part],
    // ⚠️ If your PatternGroup has more fields (template flags, description, etc),
    // keep them here exactly as in your current `createSeedData` function.
    isTemplate: false,
  };

  return {
    palettes: { [palette.id]: palette },
    shapes,
    patterns: { [pattern.id]: pattern },
    groups: { [group.id]: group },
  };
}
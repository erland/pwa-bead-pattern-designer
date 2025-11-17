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
// Seed palettes
// ─────────────────────────────────────────────────────────────────────────────

function createSeedPalettes(): Record<string, BeadPalette> {
  // 1) Your original demo palette (kept as-is so the demo pattern still works)
  const demoPaletteId = 'palette-basic';
  const demoColors: BeadColor[] = [
    { id: 'c-white', name: 'White', paletteId: demoPaletteId, rgb: { r: 255, g: 255, b: 255 } },
    { id: 'c-black', name: 'Black', paletteId: demoPaletteId, rgb: { r: 0, g: 0, b: 0 } },
    { id: 'c-red', name: 'Red', paletteId: demoPaletteId, rgb: { r: 230, g: 57, b: 70 } },
    { id: 'c-green', name: 'Green', paletteId: demoPaletteId, rgb: { r: 42, g: 157, b: 143 } },
    { id: 'c-blue', name: 'Blue', paletteId: demoPaletteId, rgb: { r: 38, g: 70, b: 83 } },
    { id: 'c-yellow', name: 'Yellow', paletteId: demoPaletteId, rgb: { r: 244, g: 208, b: 63 } },
  ];

  const demoPalette: BeadPalette = {
    id: demoPaletteId,
    name: 'Basic Demo Palette',
    brand: 'Demo',
    colors: demoColors,
  };

  // 2) Hama Midi – Classic 10 (solid + a couple of soft pastels)
  //
  // Names loosely follow Hama’s numbering:
  // 01 White, 02 Cream, 03 Yellow, 05 Red, 09 Light Blue, 10 Green,
  // 17 Grey, 18 Black, 46 Pastel Blue, 48 Pastel Pink
  const hamaClassicId = 'palette-hama-midi-classic-10';
  const hamaClassicColors: BeadColor[] = [
    {
      id: 'hama-01-white',
      name: '01 White',
      paletteId: hamaClassicId,
      rgb: { r: 255, g: 255, b: 255 },
    },
    {
      id: 'hama-02-cream',
      name: '02 Cream',
      paletteId: hamaClassicId,
      rgb: { r: 255, g: 253, b: 208 },
    },
    {
      id: 'hama-03-yellow',
      name: '03 Yellow',
      paletteId: hamaClassicId,
      rgb: { r: 255, g: 221, b: 51 },
    },
    {
      id: 'hama-05-red',
      name: '05 Red',
      paletteId: hamaClassicId,
      rgb: { r: 220, g: 40, b: 60 },
    },
    {
      id: 'hama-09-light-blue',
      name: '09 Light Blue',
      paletteId: hamaClassicId,
      rgb: { r: 120, g: 180, b: 255 },
    },
    {
      id: 'hama-10-green',
      name: '10 Green',
      paletteId: hamaClassicId,
      rgb: { r: 34, g: 139, b: 34 },
    },
    {
      id: 'hama-17-grey',
      name: '17 Grey',
      paletteId: hamaClassicId,
      rgb: { r: 120, g: 120, b: 120 },
    },
    {
      id: 'hama-18-black',
      name: '18 Black',
      paletteId: hamaClassicId,
      rgb: { r: 0, g: 0, b: 0 },
    },
    {
      id: 'hama-46-pastel-blue',
      name: '46 Pastel Blue',
      paletteId: hamaClassicId,
      rgb: { r: 173, g: 216, b: 230 },
    },
    {
      id: 'hama-48-pastel-pink',
      name: '48 Pastel Pink',
      paletteId: hamaClassicId,
      rgb: { r: 255, g: 182, b: 193 },
    },
  ];

  const hamaClassicPalette: BeadPalette = {
    id: hamaClassicId,
    name: 'Hama Midi – Classic 10',
    brand: 'Hama Midi',
    colors: hamaClassicColors,
  };

  // 3) Hama Midi – Pastel & Neon mix
  //
  // A small “fun” palette with some pastels and neons typically seen
  // in Hama sets (names & numbers are indicative, RGB is approximate).
  const hamaPastelNeonId = 'palette-hama-midi-pastel-neon';
  const hamaPastelNeonColors: BeadColor[] = [
    {
      id: 'hama-43-pastel-yellow',
      name: '43 Pastel Yellow',
      paletteId: hamaPastelNeonId,
      rgb: { r: 255, g: 244, b: 170 },
    },
    {
      id: 'hama-44-pastel-red',
      name: '44 Pastel Red',
      paletteId: hamaPastelNeonId,
      rgb: { r: 255, g: 160, b: 160 },
    },
    {
      id: 'hama-45-pastel-purple',
      name: '45 Pastel Purple',
      paletteId: hamaPastelNeonId,
      rgb: { r: 209, g: 178, b: 255 },
    },
    {
      id: 'hama-46-pastel-blue',
      name: '46 Pastel Blue',
      paletteId: hamaPastelNeonId,
      rgb: { r: 173, g: 216, b: 230 },
    },
    {
      id: 'hama-47-pastel-green',
      name: '47 Pastel Green',
      paletteId: hamaPastelNeonId,
      rgb: { r: 185, g: 230, b: 185 },
    },
    {
      id: 'hama-34-neon-yellow',
      name: '34 Neon Yellow',
      paletteId: hamaPastelNeonId,
      rgb: { r: 255, g: 255, b: 102 },
    },
    {
      id: 'hama-35-neon-red',
      name: '35 Neon Red',
      paletteId: hamaPastelNeonId,
      rgb: { r: 255, g: 85, b: 85 },
    },
    {
      id: 'hama-36-neon-blue',
      name: '36 Neon Blue',
      paletteId: hamaPastelNeonId,
      rgb: { r: 80, g: 150, b: 255 },
    },
    {
      id: 'hama-37-neon-green',
      name: '37 Neon Green',
      paletteId: hamaPastelNeonId,
      rgb: { r: 120, g: 255, b: 120 },
    },
    {
      id: 'hama-38-neon-orange',
      name: '38 Neon Orange',
      paletteId: hamaPastelNeonId,
      rgb: { r: 255, g: 165, b: 0 },
    },
  ];

  const hamaPastelNeonPalette: BeadPalette = {
    id: hamaPastelNeonId,
    name: 'Hama Midi – Pastel & Neon',
    brand: 'Hama Midi',
    colors: hamaPastelNeonColors,
  };

  // Collect them into a map
  const map: Record<string, BeadPalette> = {};
  for (const palette of [hamaClassicPalette, hamaPastelNeonPalette, demoPalette]) {
    map[palette.id] = palette;
  }
  return map;
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
  const palettes = createSeedPalettes();
  const shapes = createSeedShapes();

  const defaultShape = shapes['shape-square-16'];
  // Use your original demo palette as the default (fall back to any palette)
  const defaultPalette =
    palettes['palette-basic'] ?? Object.values(palettes)[0];

  const patternId = 'pattern-demo-house-front';
  const now = new Date().toISOString();

  const pattern: BeadPattern = {
    id: patternId,
    name: 'Demo Pattern',
    shapeId: defaultShape.id,
    cols: defaultShape.cols,
    rows: defaultShape.rows,
    paletteId: defaultPalette.id,
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
    isTemplate: false,
  };

  return {
    palettes,
    shapes,
    patterns: { [pattern.id]: pattern },
    groups: { [group.id]: group },
  };
}
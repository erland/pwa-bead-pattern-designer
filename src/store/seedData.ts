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
  // 1) Basic demo palette (unchanged)
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

  // 2) Hama Midi – Classic 10 (unchanged)
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

  // 3) Hama Midi – SOLID palette (from Colour palette – Midi 5+)
  const hamaSolidId = 'palette-hama-midi-solid';
  const hamaSolidColors: BeadColor[] = [
    // Purples
    { id: 'hama-108-aubergine', name: '108 Aubergine', paletteId: hamaSolidId, rgb: { r: 70, g: 0, b: 40 } },
    { id: 'hama-07-purple', name: '07 Purple', paletteId: hamaSolidId, rgb: { r: 128, g: 0, b: 128 } },
    { id: 'hama-45-pastel-purple', name: '45 Pastel purple', paletteId: hamaSolidId, rgb: { r: 209, g: 178, b: 255 } },
    { id: 'hama-96-pastel-lilac', name: '96 Pastel lilac', paletteId: hamaSolidId, rgb: { r: 230, g: 210, b: 255 } },
    { id: 'hama-106-light-lavender', name: '106 Light lavender', paletteId: hamaSolidId, rgb: { r: 220, g: 200, b: 255 } },
    { id: 'hama-107-lavender', name: '107 Lavender', paletteId: hamaSolidId, rgb: { r: 181, g: 126, b: 220 } },

    // Blues & blue-greens
    { id: 'hama-116-midnight-blue', name: '116 Midnight blue', paletteId: hamaSolidId, rgb: { r: 25, g: 25, b: 112 } },
    { id: 'hama-08-blue', name: '08 Blue', paletteId: hamaSolidId, rgb: { r: 0, g: 102, b: 204 } },
    { id: 'hama-09-light-blue', name: '09 Light blue', paletteId: hamaSolidId, rgb: { r: 135, g: 206, b: 250 } },
    { id: 'hama-46-pastel-blue', name: '46 Pastel blue', paletteId: hamaSolidId, rgb: { r: 173, g: 216, b: 230 } },
    { id: 'hama-97-pastel-ice-blue', name: '97 Pastel ice blue', paletteId: hamaSolidId, rgb: { r: 210, g: 230, b: 255 } },
    { id: 'hama-31-turquoise', name: '31 Turquoise', paletteId: hamaSolidId, rgb: { r: 64, g: 224, b: 208 } },
    { id: 'hama-49-azure', name: '49 Azure', paletteId: hamaSolidId, rgb: { r: 0, g: 127, b: 255 } },
    { id: 'hama-113-aqua', name: '113 Aqua', paletteId: hamaSolidId, rgb: { r: 0, g: 200, b: 200 } },
    { id: 'hama-83-petrol-blue', name: '83 Petrol blue', paletteId: hamaSolidId, rgb: { r: 0, g: 95, b: 110 } },

    // Greens
    { id: 'hama-28-dark-green', name: '28 Dark green', paletteId: hamaSolidId, rgb: { r: 0, g: 100, b: 0 } },
    { id: 'hama-102-forest-green', name: '102 Forest green', paletteId: hamaSolidId, rgb: { r: 0, g: 90, b: 50 } },
    { id: 'hama-84-olive-green', name: '84 Olive green', paletteId: hamaSolidId, rgb: { r: 128, g: 128, b: 0 } },
    { id: 'hama-110-matcha', name: '110 Matcha', paletteId: hamaSolidId, rgb: { r: 170, g: 200, b: 120 } },
    { id: 'hama-101-eucalyptus', name: '101 Eucalyptus', paletteId: hamaSolidId, rgb: { r: 100, g: 140, b: 100 } },
    { id: 'hama-98-pastel-mint', name: '98 Pastel mint', paletteId: hamaSolidId, rgb: { r: 200, g: 255, b: 230 } },
    { id: 'hama-115-bright-green', name: '115 Bright green', paletteId: hamaSolidId, rgb: { r: 0, g: 200, b: 0 } },
    { id: 'hama-11-light-green', name: '11 Light green', paletteId: hamaSolidId, rgb: { r: 144, g: 238, b: 144 } },
    { id: 'hama-10-green', name: '10 Green', paletteId: hamaSolidId, rgb: { r: 34, g: 139, b: 34 } },

    // Yellows & yellow-greens
    { id: 'hama-60-teddybear-brown', name: '60 Teddybear brown', paletteId: hamaSolidId, rgb: { r: 190, g: 140, b: 90 } },
    { id: 'hama-03-yellow', name: '03 Yellow', paletteId: hamaSolidId, rgb: { r: 255, g: 221, b: 51 } },
    { id: 'hama-103-light-yellow', name: '103 Light yellow', paletteId: hamaSolidId, rgb: { r: 255, g: 239, b: 170 } },
    { id: 'hama-43-pastel-yellow', name: '43 Pastel yellow', paletteId: hamaSolidId, rgb: { r: 255, g: 244, b: 170 } },
    { id: 'hama-02-cream', name: '02 Cream', paletteId: hamaSolidId, rgb: { r: 255, g: 253, b: 208 } },
    { id: 'hama-104-lime', name: '104 Lime', paletteId: hamaSolidId, rgb: { r: 191, g: 255, b: 0 } },
    { id: 'hama-47-pastel-green', name: '47 Pastel green', paletteId: hamaSolidId, rgb: { r: 185, g: 230, b: 185 } },

    // Reds & pinks
    { id: 'hama-22-dark-red', name: '22 Dark red', paletteId: hamaSolidId, rgb: { r: 139, g: 0, b: 0 } },
    { id: 'hama-05-red', name: '05 Red', paletteId: hamaSolidId, rgb: { r: 220, g: 40, b: 60 } },
    { id: 'hama-114-cherry-red', name: '114 Cherry red', paletteId: hamaSolidId, rgb: { r: 200, g: 0, b: 30 } },
    { id: 'hama-44-pastel-red', name: '44 Pastel red', paletteId: hamaSolidId, rgb: { r: 255, g: 160, b: 160 } },
    { id: 'hama-06-pink', name: '06 Pink', paletteId: hamaSolidId, rgb: { r: 255, g: 182, b: 193 } },
    { id: 'hama-95-pastel-rose', name: '95 Pastel rose', paletteId: hamaSolidId, rgb: { r: 255, g: 204, b: 204 } },
    { id: 'hama-48-pastel-pink', name: '48 Pastel pink', paletteId: hamaSolidId, rgb: { r: 255, g: 182, b: 193 } },
    { id: 'hama-29-claret', name: '29 Claret', paletteId: hamaSolidId, rgb: { r: 128, g: 0, b: 32 } },
    { id: 'hama-82-plum', name: '82 Plum', paletteId: hamaSolidId, rgb: { r: 142, g: 69, b: 133 } },

    // Skin tones & oranges
    { id: 'hama-30-burgundy', name: '30 Burgundy', paletteId: hamaSolidId, rgb: { r: 128, g: 0, b: 64 } },
    { id: 'hama-111-dark-blush', name: '111 Dark blush', paletteId: hamaSolidId, rgb: { r: 210, g: 140, b: 140 } },
    { id: 'hama-112-blush', name: '112 Blush', paletteId: hamaSolidId, rgb: { r: 240, g: 170, b: 170 } },
    { id: 'hama-26-matt-rose', name: '26 Matt rose', paletteId: hamaSolidId, rgb: { r: 250, g: 160, b: 160 } },
    { id: 'hama-78-light-peach', name: '78 Light peach', paletteId: hamaSolidId, rgb: { r: 255, g: 218, b: 185 } },
    { id: 'hama-105-light-apricot', name: '105 Light apricot', paletteId: hamaSolidId, rgb: { r: 255, g: 220, b: 180 } },
    { id: 'hama-79-apricot', name: '79 Apricot', paletteId: hamaSolidId, rgb: { r: 255, g: 204, b: 153 } },
    { id: 'hama-04-orange', name: '04 Orange', paletteId: hamaSolidId, rgb: { r: 255, g: 165, b: 0 } },

    // Browns & neutrals
    { id: 'hama-12-brown', name: '12 Brown', paletteId: hamaSolidId, rgb: { r: 139, g: 69, b: 19 } },
    { id: 'hama-76-nougat', name: '76 Nougat', paletteId: hamaSolidId, rgb: { r: 210, g: 180, b: 140 } },
    { id: 'hama-75-light-nougat', name: '75 Light nougat', paletteId: hamaSolidId, rgb: { r: 240, g: 200, b: 160 } },
    { id: 'hama-27-beige', name: '27 Beige', paletteId: hamaSolidId, rgb: { r: 245, g: 222, b: 179 } },
    { id: 'hama-21-light-brown', name: '21 Light brown', paletteId: hamaSolidId, rgb: { r: 205, g: 133, b: 63 } },
    { id: 'hama-20-reddish-brown', name: '20 Reddish brown', paletteId: hamaSolidId, rgb: { r: 165, g: 42, b: 42 } },
    { id: 'hama-18-black', name: '18 Black', paletteId: hamaSolidId, rgb: { r: 0, g: 0, b: 0 } },
    { id: 'hama-71-dark-grey', name: '71 Dark grey', paletteId: hamaSolidId, rgb: { r: 80, g: 80, b: 80 } },
    { id: 'hama-17-grey', name: '17 Grey', paletteId: hamaSolidId, rgb: { r: 120, g: 120, b: 120 } },
    { id: 'hama-70-light-grey', name: '70 Light grey', paletteId: hamaSolidId, rgb: { r: 180, g: 180, b: 180 } },
    { id: 'hama-109-cloudy-grey', name: '109 Cloudy grey', paletteId: hamaSolidId, rgb: { r: 200, g: 200, b: 210 } },
    { id: 'hama-77-cloudy-white', name: '77 Cloudy white', paletteId: hamaSolidId, rgb: { r: 245, g: 245, b: 245 } },
    { id: 'hama-01-white', name: '01 White', paletteId: hamaSolidId, rgb: { r: 255, g: 255, b: 255 } },
  ];

  const hamaSolidPalette: BeadPalette = {
    id: hamaSolidId,
    name: 'Hama Midi – Solid',
    brand: 'Hama Midi',
    colors: hamaSolidColors,
  };

  // 4) Hama Midi – TRANSLUCENT palette
  const hamaTranslucentId = 'palette-hama-midi-translucent';
  const hamaTranslucentColors: BeadColor[] = [
    { id: 'hama-24-translucent-purple', name: '24 Translucent purple', paletteId: hamaTranslucentId, rgb: { r: 186, g: 85, b: 211 } },
    { id: 'hama-74-translucent-lilac', name: '74 Translucent lilac', paletteId: hamaTranslucentId, rgb: { r: 221, g: 160, b: 221 } },
    { id: 'hama-73-translucent-aqua', name: '73 Translucent aqua', paletteId: hamaTranslucentId, rgb: { r: 175, g: 238, b: 238 } },
    { id: 'hama-15-translucent-blue', name: '15 Translucent blue', paletteId: hamaTranslucentId, rgb: { r: 135, g: 206, b: 250 } },
    { id: 'hama-16-translucent-green', name: '16 Translucent green', paletteId: hamaTranslucentId, rgb: { r: 144, g: 238, b: 144 } },
    { id: 'hama-14-translucent-yellow', name: '14 Translucent yellow', paletteId: hamaTranslucentId, rgb: { r: 255, g: 255, b: 153 } },
    { id: 'hama-13-translucent-red', name: '13 Translucent red', paletteId: hamaTranslucentId, rgb: { r: 230, g: 70, b: 90 } },
    { id: 'hama-72-translucent-pink', name: '72 Translucent pink', paletteId: hamaTranslucentId, rgb: { r: 255, g: 192, b: 203 } },
    { id: 'hama-19-clear', name: '19 Clear', paletteId: hamaTranslucentId, rgb: { r: 245, g: 250, b: 255 } },
  ];

  const hamaTranslucentPalette: BeadPalette = {
    id: hamaTranslucentId,
    name: 'Hama Midi – Translucent',
    brand: 'Hama Midi',
    colors: hamaTranslucentColors,
  };

  // 5) Hama Midi – GLOW-IN-THE-DARK palette
  const hamaGlowId = 'palette-hama-midi-glow';
  const hamaGlowColors: BeadColor[] = [
    { id: 'hama-55-glow-green', name: '55 Glow in the dark - green', paletteId: hamaGlowId, rgb: { r: 190, g: 255, b: 190 } },
    { id: 'hama-56-glow-red', name: '56 Glow in the dark - red', paletteId: hamaGlowId, rgb: { r: 255, g: 190, b: 190 } },
  ];

  const hamaGlowPalette: BeadPalette = {
    id: hamaGlowId,
    name: 'Hama Midi – Glow in the Dark',
    brand: 'Hama Midi',
    colors: hamaGlowColors,
  };

  // 6) Hama Midi – SHINE palette (metallic & pearl)
  const hamaShineId = 'palette-hama-midi-shine';
  const hamaShineColors: BeadColor[] = [
    { id: 'hama-61-gold', name: '61 Gold', paletteId: hamaShineId, rgb: { r: 212, g: 175, b: 55 } },
    { id: 'hama-62-silver', name: '62 Silver', paletteId: hamaShineId, rgb: { r: 192, g: 192, b: 192 } },
    { id: 'hama-63-bronze', name: '63 Bronze', paletteId: hamaShineId, rgb: { r: 205, g: 127, b: 50 } },
    { id: 'hama-64-pearl', name: '64 Pearl', paletteId: hamaShineId, rgb: { r: 245, g: 245, b: 230 } },
  ];

  const hamaShinePalette: BeadPalette = {
    id: hamaShineId,
    name: 'Hama Midi – Shine',
    brand: 'Hama Midi',
    colors: hamaShineColors,
  };

  // 7) Hama Midi – NEON palette
  const hamaNeonId = 'palette-hama-midi-neon';
  const hamaNeonColors: BeadColor[] = [
    { id: 'hama-36-neon-blue', name: '36 Neon blue', paletteId: hamaNeonId, rgb: { r: 0, g: 153, b: 255 } },
    { id: 'hama-37-neon-green', name: '37 Neon green', paletteId: hamaNeonId, rgb: { r: 57, g: 255, b: 20 } },
    { id: 'hama-34-neon-yellow', name: '34 Neon yellow', paletteId: hamaNeonId, rgb: { r: 255, g: 255, b: 0 } },
    { id: 'hama-38-neon-orange', name: '38 Neon orange', paletteId: hamaNeonId, rgb: { r: 255, g: 140, b: 0 } },
    { id: 'hama-35-neon-red', name: '35 Neon red', paletteId: hamaNeonId, rgb: { r: 255, g: 51, b: 51 } },
    { id: 'hama-32-neon-fuchsia', name: '32 Neon fuchsia', paletteId: hamaNeonId, rgb: { r: 255, g: 0, b: 204 } },
  ];

  const hamaNeonPalette: BeadPalette = {
    id: hamaNeonId,
    name: 'Hama Midi – Neon',
    brand: 'Hama Midi',
    colors: hamaNeonColors,
  };

  // 9) Hama Midi – ALL palette (concatenate all categories, same colour IDs)
  const hamaAllId = 'palette-hama-midi-full';
  const hamaAllColors: BeadColor[] = [
    ...hamaSolidColors.map((c) => ({ ...c, paletteId: hamaAllId })),
    ...hamaTranslucentColors.map((c) => ({ ...c, paletteId: hamaAllId })),
    ...hamaGlowColors.map((c) => ({ ...c, paletteId: hamaAllId })),
    ...hamaShineColors.map((c) => ({ ...c, paletteId: hamaAllId })),
    ...hamaNeonColors.map((c) => ({ ...c, paletteId: hamaAllId })),
  ];

  const hamaAllPalette: BeadPalette = {
    id: hamaAllId,
    name: 'Hama Midi – Full Palette (All Finishes)',
    brand: 'Hama Midi',
    colors: hamaAllColors,
  };

  // Collect all palettes into a map
  const map: Record<string, BeadPalette> = {};
  for (const palette of [
    hamaClassicPalette,
    hamaNeonPalette,
    hamaTranslucentPalette,
    hamaGlowPalette,
    hamaShinePalette,
    hamaSolidPalette,
    hamaAllPalette,
    demoPalette,
  ]) {
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
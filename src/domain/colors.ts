// src/domain/colors.ts

/** Unique identifier for a bead color (palette-scoped or global). */
export type BeadColorId = string;

/** RGB representation in 0–255 range. */
export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

/** Single bead color entry in a palette. */
export interface BeadColor {
  id: BeadColorId;
  /** Human-friendly name, e.g. "Light Blue" */
  name: string;
  /** Owning palette id */
  paletteId: string;
  /** Display color */
  rgb: RgbColor;
}

/** A named bead color palette, e.g. a brand subset (Hama, Perler, etc.) */
export interface BeadPalette {
  id: string;
  name: string;
  /** Optional brand info, e.g. "Hama", "Perler" */
  brand?: string;
  /** Colors belonging to this palette */
  colors: BeadColor[];
}

/** Type guard helpers */

export function isBeadColor(value: unknown): value is BeadColor {
  if (!value || typeof value !== 'object') return false;
  const v = value as BeadColor;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.paletteId === 'string' &&
    typeof v.rgb === 'object' &&
    typeof v.rgb.r === 'number' &&
    typeof v.rgb.g === 'number' &&
    typeof v.rgb.b === 'number'
  );
}

export function isBeadPalette(value: unknown): value is BeadPalette {
  if (!value || typeof value !== 'object') return false;
  const v = value as BeadPalette;
  return typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.colors);
}
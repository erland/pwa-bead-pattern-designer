// src/store/beadStore.ts
import { create } from 'zustand';
import type { BeadPalette, BeadColor } from '../domain/colors';
import { DEFAULT_SHAPES, type PegboardShape, createRectangleShape } from '../domain/shapes';
import type { BeadPattern, PatternGroup, PatternPart } from '../domain/patterns';
import { createEmptyGrid } from '../domain/patterns';

type BeadStoreData = {
  patterns: Record<string, BeadPattern>;
  groups: Record<string, PatternGroup>;
  palettes: Record<string, BeadPalette>;
  shapes: Record<string, PegboardShape>;
};

type CreatePatternInput = {
  name: string;
  shapeId: string;
  cols: number;
  rows: number;
  paletteId: string;

  // 🆕 Optional ownership flags
  belongsToGroupId?: string | null;
  belongsToPartId?: string | null;
};

type BeadStoreActions = {
  createPattern: (input: CreatePatternInput) => string;
  updatePattern: (id: string, updates: Partial<Omit<BeadPattern, 'id'>>) => void;
  deletePattern: (id: string) => void;

  createGroup: (name: string) => string;
  updateGroup: (id: string, updates: Partial<Omit<PatternGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;

  addPartToGroup: (
    groupId: string,
    input: { name: string; patternId: string },
  ) => string;
  removePartFromGroup: (groupId: string, partId: string) => void;
  renamePart: (groupId: string, partId: string, newName: string) => void;
  reorderParts: (groupId: string, newOrder: string[]) => void;
};

export type BeadStoreState = BeadStoreData & BeadStoreActions;

// ─────────────────────────────────────────────────────────────────────────────
// ID helper
// ─────────────────────────────────────────────────────────────────────────────

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
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

function createSeedData(): BeadStoreData {
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
    name: 'Demo 3D House',
    parts: [part],
  };

  return {
    palettes: { [palette.id]: palette },
    shapes,
    patterns: { [pattern.id]: pattern },
    groups: { [group.id]: group },
  };
}

function createInitialData(): BeadStoreData {
  return createSeedData();
}

// ─────────────────────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────────────────────

export const useBeadStore = create<BeadStoreState>((set) => ({
  ...createInitialData(),

  createPattern: (input) => {
    const id = createId('pattern');
    const now = new Date().toISOString();
    const pattern: BeadPattern = {
      id,
      name: input.name,
      shapeId: input.shapeId,
      cols: input.cols,
      rows: input.rows,
      paletteId: input.paletteId,
      grid: createEmptyGrid(input.cols, input.rows),
      createdAt: now,
      updatedAt: now,

      // 🆕 propagate ownership flags
      belongsToGroupId: input.belongsToGroupId ?? null,
      belongsToPartId: input.belongsToPartId ?? null,
    };

    set((state) => ({
      patterns: {
        ...state.patterns,
        [id]: pattern,
      },
    }));

    return id;
  },

  updatePattern: (id, updates) => {
    set((state) => {
      const existing = state.patterns[id];
      if (!existing) return {};
      const updated: BeadPattern = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return {
        patterns: {
          ...state.patterns,
          [id]: updated,
        },
      };
    });
  },

  deletePattern: (id) => {
    set((state) => {
      const { [id]: _deleted, ...rest } = state.patterns;
      // Also remove references from groups
      const updatedGroups: Record<string, PatternGroup> = {};
      for (const [groupId, group] of Object.entries(state.groups)) {
        const parts = group.parts.filter((p) => p.patternId !== id);
        updatedGroups[groupId] = { ...group, parts };
      }
      return {
        patterns: rest,
        groups: updatedGroups,
      };
    });
  },

  createGroup: (name) => {
    const id = createId('group');
    const group: PatternGroup = {
      id,
      name,
      parts: [],
    };

    set((state) => ({
      groups: {
        ...state.groups,
        [id]: group,
      },
    }));

    return id;
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const existing = state.groups[id];
      if (!existing) return {};
      const updated: PatternGroup = {
        ...existing,
        ...updates,
      };
      return {
        groups: {
          ...state.groups,
          [id]: updated,
        },
      };
    });
  },

  deleteGroup: (id) => {
    set((state) => {
      const { [id]: _deleted, ...rest } = state.groups;

      const newPatterns: Record<string, BeadPattern> = {};
      for (const pattern of Object.values(state.patterns)) {
        if (pattern.belongsToGroupId === id) {
          // skip = delete embedded pattern
          continue;
        }
        newPatterns[pattern.id] = pattern;
      }

      return { groups: rest, patterns: newPatterns };
    });
  },

  addPartToGroup: (groupId, input) => {
    const partId = createId('part');
    const newPart: PatternPart = {
      id: partId,
      name: input.name,
      patternId: input.patternId,
    };

    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};
      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            parts: [...group.parts, newPart],
          },
        },
      };
    });

    return partId;
  },

  removePartFromGroup: (groupId, partId) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};
      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            parts: group.parts.filter((p) => p.id !== partId),
          },
        },
      };
    });
  },

  renamePart: (groupId, partId, newName) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};
      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            parts: group.parts.map((p) =>
              p.id === partId ? { ...p, name: newName } : p,
            ),
          },
        },
      };
    });
  },

  reorderParts: (groupId, newOrder) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};
      const partMap: Record<string, PatternPart> = {};
      for (const p of group.parts) {
        partMap[p.id] = p;
      }
      const reordered: PatternPart[] = [];
      for (const id of newOrder) {
        const part = partMap[id];
        if (part) reordered.push(part);
      }
      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            parts: reordered,
          },
        },
      };
    });
  },
}));

// Helper for tests so we can reset to seed state
export function resetBeadStoreForTests() {
  useBeadStore.setState((state) => ({
    ...state,
    ...createInitialData(),
  }));
}
// src/store/beadStore.ts
import { create } from 'zustand';
import type { BeadPalette, BeadColorId } from '../domain/colors';
import type { PegboardShape } from '../domain/shapes';
import { createRectangleShape } from '../domain/shapes';
import type { BeadPattern, PatternGroup, PatternPart, DimensionGuide } from '../domain/patterns';
import { createEmptyGrid } from '../domain/patterns';
import { createSeedData } from './seedData';

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

  /** Optional initial grid. When omitted, an empty grid is created. */
  grid?: (BeadColorId | null)[][];

  // 🆕 Optional ownership flags
  belongsToGroupId?: string | null;
  belongsToPartId?: string | null;
};

type BeadStoreActions = {
  createPattern: (input: CreatePatternInput) => string;
  updatePattern: (id: string, updates: Partial<Omit<BeadPattern, 'id'>>) => void;
  deletePattern: (id: string) => void;

  /**
   * Ensure there is a rectangular PegboardShape for the given cols/rows.
   * Returns the shape id (existing or newly created).
   */
  ensureRectangleShape: (cols: number, rows: number) => string;

  createGroup: (name: string) => string;
  markGroupAsTemplate: (groupId: string, isTemplate: boolean, description?: string) => void;
  createGroupFromTemplateGroup: (templateGroupId: string) => string;
  updateGroup: (id: string, updates: Partial<Omit<PatternGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;

  addPartToGroup: (
    groupId: string,
    input: { name: string; patternId: string },
  ) => string;
  removePartFromGroup: (groupId: string, partId: string) => void;
  renamePart: (groupId: string, partId: string, newName: string) => void;
  reorderParts: (groupId: string, newOrder: string[]) => void;

  // 🧱 Dimension guide actions
  addDimensionGuide: (groupId: string, guide: DimensionGuide) => void;
  updateDimensionGuide: (
    groupId: string,
    guideId: string,
    patch: Partial<DimensionGuide>,
  ) => void;
  removeDimensionGuide: (groupId: string, guideId: string) => void;
  /** Palette management per pattern */
  addColorToPattern: (patternId: string, colorId: BeadColorId) => void;
  removeColorFromPattern: (patternId: string, colorId: BeadColorId) => void;
  setPatternActiveColors: (patternId: string, colorIds: BeadColorId[]) => void;
};

export type BeadStoreState = BeadStoreData & BeadStoreActions;

// ─────────────────────────────────────────────────────────────────────────────
// ID helper
// ─────────────────────────────────────────────────────────────────────────────

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function inferActiveColorIdsForPattern(
  pattern: BeadPattern,
  palettes: Record<string, BeadPalette>,
): BeadColorId[] {
  const palette = palettes[pattern.paletteId];
  if (!palette) return [];
  return palette.colors.map((c) => c.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

function createInitialData(): BeadStoreData {
  // `SeedData` and `BeadStoreData` have the same shape,
  // so this is structurally compatible.
  return createSeedData();
}

// ─────────────────────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────────────────────

export const useBeadStore = create<BeadStoreState>((set) => ({
  ...createInitialData(),

  ensureRectangleShape: (cols, rows) => {
    const id = `shape-rect-${cols}x${rows}`;
  
    set((state) => {
      if (state.shapes[id]) {
        // No changes – return the same state object so Zustand
        // won't think anything changed.
        return state;
      }
  
      const name =
        cols === rows ? `Square ${cols}×${rows}` : `Rectangle ${cols}×${rows}`;
  
      const shape = createRectangleShape(id, name, cols, rows);
  
      return {
        ...state,
        shapes: {
          ...state.shapes,
          [id]: shape,
        },
      };
    });
  
    return id;
  },
  
  createPattern: (input) => {
    const id = createId('pattern');
    const now = new Date().toISOString();

    // Use provided grid if it matches the requested size; otherwise fall back.
    let grid = input.grid;
    const rowsOk = Array.isArray(grid) && grid.length === input.rows;
    const colsOk =
      rowsOk &&
      grid![0] &&
      grid![0].length === input.cols;

    const finalGrid =
      grid && rowsOk && colsOk
        ? grid
        : createEmptyGrid(input.cols, input.rows);

    const pattern: BeadPattern = {
      id,
      name: input.name,
      shapeId: input.shapeId,
      cols: input.cols,
      rows: input.rows,
      paletteId: input.paletteId,
      grid: finalGrid,
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

  markGroupAsTemplate: (groupId, isTemplate) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};

      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            isTemplate,
          },
        },
      };
    });
  },

  createGroupFromTemplateGroup: (templateGroupId) => {
    const groupId = createId('group');
    const now = new Date().toISOString();
  
    set((state) => {
      const templateGroup = state.groups[templateGroupId];
      if (!templateGroup) {
        // no change
        return {};
      }
  
      const patterns: Record<string, BeadPattern> = { ...state.patterns };
      const parts: PatternPart[] = [];
  
      for (const templatePart of templateGroup.parts) {
        const templatePattern = patterns[templatePart.patternId];
        if (!templatePattern) continue; // skip if corrupted
  
        const newPartId = createId('part');
        const newPatternId = createId('pattern');
  
        // Deep copy pattern for this part
        patterns[newPatternId] = {
          ...templatePattern,
          id: newPatternId,
          name: templatePattern.name, // or templatePart.name if you prefer
          createdAt: now,
          updatedAt: now,
          belongsToGroupId: groupId,
          belongsToPartId: newPartId,
          grid: templatePattern.grid.map((row) => [...row]),
        };
  
        parts.push({
          id: newPartId,
          name: templatePart.name,
          patternId: newPatternId,
        });
      }
  
      const newGroup: PatternGroup = {
        id: groupId,
        name: templateGroup.name,
        parts,
        // 🔴 New group is *not* a template, even if the source was
        isTemplate: false,
      };
  
      return {
        patterns,
        groups: {
          ...state.groups,
          [groupId]: newGroup,
        },
      };
    });
  
    return groupId;
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
  // ─────────────────────────────────────────────────────────────
  // Dimension guides
  // ─────────────────────────────────────────────────────────────

  addDimensionGuide: (groupId, guide) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return {};

      const meta = group.assemblyMetadata ?? {};
      const guides = meta.dimensionGuides ?? [];

      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            assemblyMetadata: {
              ...meta,
              dimensionGuides: [...guides, guide],
            },
          },
        },
      };
    });
  },

  updateDimensionGuide: (groupId, guideId, patch) => {
    set((state) => {
      const group = state.groups[groupId];
      const existingGuides = group?.assemblyMetadata?.dimensionGuides;
      if (!group || !existingGuides) return {};

      const nextGuides = existingGuides.map((g) =>
        g.id === guideId ? { ...g, ...patch } : g,
      );

      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            assemblyMetadata: {
              ...group.assemblyMetadata,
              dimensionGuides: nextGuides,
            },
          },
        },
      };
    });
  },

  removeDimensionGuide: (groupId, guideId) => {
    set((state) => {
      const group = state.groups[groupId];
      const existingGuides = group?.assemblyMetadata?.dimensionGuides;
      if (!group || !existingGuides) return {};

      const nextGuides = existingGuides.filter((g) => g.id !== guideId);

      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            assemblyMetadata: {
              ...group.assemblyMetadata,
              dimensionGuides: nextGuides,
            },
          },
        },
      };
    });
  },
  
  addColorToPattern: (patternId, colorId) => {
    set((state) => {
      const pattern = state.patterns[patternId];
      if (!pattern) return state;
      const active =
        pattern.activeColorIds ??
        inferActiveColorIdsForPattern(pattern, state.palettes);
      if (active.includes(colorId)) {
        return state;
      }
      return {
        ...state,
        patterns: {
          ...state.patterns,
          [patternId]: {
            ...pattern,
            activeColorIds: [...active, colorId],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  removeColorFromPattern: (patternId, colorId) => {
    set((state) => {
      const pattern = state.patterns[patternId];
      if (!pattern) return state;
      const active =
        pattern.activeColorIds ??
        inferActiveColorIdsForPattern(pattern, state.palettes);
      const next = active.filter((id) => id !== colorId);
      // Policy choice: only remove from active list; do NOT auto-clear grid cells
      // using this color. If you prefer auto-clear, you can also map over grid here.
      return {
        ...state,
        patterns: {
          ...state.patterns,
          [patternId]: {
            ...pattern,
            activeColorIds: next,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  setPatternActiveColors: (patternId, colorIds) => {
    set((state) => {
      const pattern = state.patterns[patternId];
      if (!pattern) return state;
      return {
        ...state,
        patterns: {
          ...state.patterns,
          [patternId]: {
            ...pattern,
            activeColorIds: [...new Set(colorIds)],
            updatedAt: new Date().toISOString(),
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
// src/store/beadStore.ts
import { create } from 'zustand';
import type { BeadPalette } from '../domain/colors';
import type { PegboardShape } from '../domain/shapes';
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

  // 🆕 Optional ownership flags
  belongsToGroupId?: string | null;
  belongsToPartId?: string | null;
};

type BeadStoreActions = {
  createPattern: (input: CreatePatternInput) => string;
  updatePattern: (id: string, updates: Partial<Omit<BeadPattern, 'id'>>) => void;
  deletePattern: (id: string) => void;

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
}));

// Helper for tests so we can reset to seed state
export function resetBeadStoreForTests() {
  useBeadStore.setState((state) => ({
    ...state,
    ...createInitialData(),
  }));
}
// src/persistence/__tests__/storage.test.ts

import { StorageService, type PersistedBeadState, __resetStorageServiceForTests } from '../storage';

// For convenience, define a small helper snapshot the type system accepts.
function createSampleState(): PersistedBeadState {
  return {
    patterns: {
      'pattern-1': {
        id: 'pattern-1',
        name: 'Test Pattern',
        shapeId: 'shape-square-5',
        cols: 5,
        rows: 5,
        paletteId: 'palette-basic',
        // We don't need a full 5x5 grid for these tests – any 2D array is fine.
        grid: [[]],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
    groups: {
      'group-1': {
        id: 'group-1',
        name: 'Test Group',
        parts: [
          {
            id: 'part-1',
            name: 'Front Wall',
            patternId: 'pattern-1',
          },
        ],
      },
    },
    palettes: {
      'palette-basic': {
        id: 'palette-basic',
        name: 'Basic Palette',
        brand: 'Demo',
        colors: [],
      },
    },
    shapes: {
      'shape-square-5': {
        id: 'shape-square-5',
        name: 'Square 5×5',
        kind: 'square',
        cols: 5,
        rows: 5,
      },
    },
  };
}

describe('StorageService (in-memory fallback)', () => {
  let originalIndexedDB: any;

  beforeAll(() => {
    // Remember whatever Jest/jsdom has set up for indexedDB
    originalIndexedDB = (globalThis as any).indexedDB;
  });

  beforeEach(() => {
    // Force the service into "no IndexedDB" mode so it uses memorySnapshot
    (globalThis as any).indexedDB = undefined;
    __resetStorageServiceForTests();
  });

  afterAll(() => {
    // Restore original indexedDB implementation after tests
    (globalThis as any).indexedDB = originalIndexedDB;
  });

  it('returns null from loadAll() when nothing has been saved', async () => {
    const result = await StorageService.loadAll();
    expect(result).toBeNull();
  });

  it('persists and reloads a snapshot via saveAll/loadAll', async () => {
    const sample = createSampleState();

    await StorageService.saveAll(sample);
    const loaded = await StorageService.loadAll();

    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(sample);
  });

  it('allows subsequent saves to overwrite previous state', async () => {
    const first = createSampleState();
    await StorageService.saveAll(first);

    const second: PersistedBeadState = {
      patterns: {},
      groups: {},
      palettes: {},
      shapes: {},
    };

    await StorageService.saveAll(second);
    const loaded = await StorageService.loadAll();

    expect(loaded).toEqual(second);
  });
});
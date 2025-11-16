// src/store/__tests__/beadStore.test.ts
import { useBeadStore, resetBeadStoreForTests } from '../beadStore';

beforeEach(() => {
  resetBeadStoreForTests();
});

describe('Bead store – patterns', () => {
  it('creates a new pattern', () => {
    const state = useBeadStore.getState();
    const initialCount = Object.keys(state.patterns).length;

    const shape = Object.values(state.shapes)[0];
    const palette = Object.values(state.palettes)[0];
    expect(shape).toBeDefined();
    expect(palette).toBeDefined();

    const id = state.createPattern({
      name: 'Test Pattern',
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
    });

    const next = useBeadStore.getState();
    expect(Object.keys(next.patterns).length).toBe(initialCount + 1);
    expect(next.patterns[id]).toBeDefined();
    expect(next.patterns[id]?.name).toBe('Test Pattern');
  });

  it('updates a pattern name', () => {
    const state = useBeadStore.getState();
    const existingId = Object.keys(state.patterns)[0];
    state.updatePattern(existingId, { name: 'Renamed Pattern' });

    const next = useBeadStore.getState();
    expect(next.patterns[existingId]?.name).toBe('Renamed Pattern');
  });

  it('deletes a pattern and removes it from groups', () => {
    const state = useBeadStore.getState();
    const existingId = Object.keys(state.patterns)[0];

    // Ensure at least one group references this pattern in seed
    const groupsWithPattern = Object.values(state.groups).filter((g) =>
      g.parts.some((p) => p.patternId === existingId),
    );
    expect(groupsWithPattern.length).toBeGreaterThanOrEqual(0);

    state.deletePattern(existingId);

    const next = useBeadStore.getState();
    expect(next.patterns[existingId]).toBeUndefined();

    for (const group of Object.values(next.groups)) {
      for (const part of group.parts) {
        expect(part.patternId).not.toBe(existingId);
      }
    }
  });
});

describe('Bead store – groups and parts', () => {
  it('creates a new group', () => {
    const state = useBeadStore.getState();
    const initialCount = Object.keys(state.groups).length;
    const id = state.createGroup('My Group');

    const next = useBeadStore.getState();
    expect(Object.keys(next.groups).length).toBe(initialCount + 1);
    expect(next.groups[id]?.name).toBe('My Group');
  });

  it('adds, renames and removes a part in a group', () => {
    const state = useBeadStore.getState();
    const groupId = Object.keys(state.groups)[0];
    const patternId = Object.keys(state.patterns)[0];

    const partId = state.addPartToGroup(groupId, {
      name: 'Side Wall',
      patternId,
    });

    let next = useBeadStore.getState();
    const groupAfterAdd = next.groups[groupId];
    expect(groupAfterAdd.parts.some((p) => p.id === partId)).toBe(true);

    state.renamePart(groupId, partId, 'Renamed Wall');
    next = useBeadStore.getState();
    const renamedPart = next.groups[groupId].parts.find((p) => p.id === partId);
    expect(renamedPart?.name).toBe('Renamed Wall');

    state.removePartFromGroup(groupId, partId);
    next = useBeadStore.getState();
    expect(next.groups[groupId].parts.some((p) => p.id === partId)).toBe(false);
  });

  it('reorders group parts', () => {
    const state = useBeadStore.getState();
    const groupId = Object.keys(state.groups)[0];

    // Add two parts so we have something to reorder
    const patternId = Object.keys(state.patterns)[0];
    const firstId = state.addPartToGroup(groupId, { name: 'Part 1', patternId });
    const secondId = state.addPartToGroup(groupId, { name: 'Part 2', patternId });

    let next = useBeadStore.getState();
    const originalOrder = next.groups[groupId].parts.map((p) => p.id);
    expect(originalOrder).toEqual(expect.arrayContaining([firstId, secondId]));

    state.reorderParts(groupId, [secondId, firstId]);

    next = useBeadStore.getState();
    const reordered = next.groups[groupId].parts.map((p) => p.id);
    expect(reordered[0]).toBe(secondId);
    expect(reordered[1]).toBe(firstId);
  });
});
describe('Bead store – group templates', () => {
  it('creates a small house template group with embedded patterns', () => {
    const state = useBeadStore.getState();
    const groupId = state.createGroupFromTemplate('small-house-basic');

    const next = useBeadStore.getState();
    const group = next.groups[groupId];
    expect(group).toBeDefined();
    expect(group.parts.length).toBeGreaterThanOrEqual(4);

    const firstPart = group.parts[0];
    const pattern = next.patterns[firstPart.patternId];
    expect(pattern).toBeDefined();
    expect(pattern.belongsToGroupId).toBe(groupId);
    expect(pattern.belongsToPartId).toBe(firstPart.id);
  });
});
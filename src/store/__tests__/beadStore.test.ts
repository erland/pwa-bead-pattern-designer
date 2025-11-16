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
  it('creates a new group from a template group with cloned parts and patterns', () => {
    const state = useBeadStore.getState();

    // Use the first existing group from seed as our “template group”
    const templateGroupId = Object.keys(state.groups)[0];
    const templateGroup = state.groups[templateGroupId];
    expect(templateGroup).toBeDefined();

    // Mark it as a template to simulate real usage
    state.markGroupAsTemplate(templateGroupId, true, 'Demo template');

    // Take the first part/pattern as reference for cloning behavior
    const templatePart = templateGroup.parts[0];
    const originalPattern = state.patterns[templatePart.patternId];
    expect(originalPattern).toBeDefined();

    const newGroupId = state.createGroupFromTemplateGroup(templateGroupId);

    const next = useBeadStore.getState();
    const newGroup = next.groups[newGroupId];
    expect(newGroup).toBeDefined();
    expect(newGroup.id).toBe(newGroupId);
    expect(newGroup.name).toBe(templateGroup.name);

    // Same number of parts as the template
    expect(newGroup.parts.length).toBe(templateGroup.parts.length);

    // New group should NOT be marked as template
    expect(newGroup.isTemplate).toBe(false);

    // Check first part/pattern cloning
    const newPart = newGroup.parts[0];
    const clonedPattern = next.patterns[newPart.patternId];
    expect(clonedPattern).toBeDefined();

    // Different pattern id than the original
    expect(clonedPattern.id).not.toBe(originalPattern.id);

    // Ownership updated to the new group/part
    expect(clonedPattern.belongsToGroupId).toBe(newGroupId);
    expect(clonedPattern.belongsToPartId).toBe(newPart.id);

    // Grid deep-cloned: same content, different references
    expect(clonedPattern.grid).toEqual(originalPattern.grid);
    expect(clonedPattern.grid).not.toBe(originalPattern.grid);

    if (clonedPattern.grid.length > 0 && originalPattern.grid.length > 0) {
      expect(clonedPattern.grid[0]).toEqual(originalPattern.grid[0]);
      expect(clonedPattern.grid[0]).not.toBe(originalPattern.grid[0]);
    }
  });
});

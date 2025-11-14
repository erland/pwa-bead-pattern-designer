// src/editor/__tests__/history.test.ts
import { createInitialHistory, applyChange, undoHistory, redoHistory } from '../history';
import type { BeadGrid } from '../tools';

function makeGrid(val: string): BeadGrid {
  return [
    [val, val],
    [val, val],
  ];
}

describe('history helpers', () => {
  it('initializes with present state only', () => {
    const g = makeGrid('a');
    const h = createInitialHistory(g);
    expect(h.past).toHaveLength(0);
    expect(h.future).toHaveLength(0);
    expect(h.present).not.toBe(g); // cloned
  });

  it('applyChange pushes present to past and clears future', () => {
    const initial = makeGrid('a');
    let h = createInitialHistory(initial);

    const g2 = makeGrid('b');
    h = applyChange(h, g2);

    expect(h.past).toHaveLength(1);
    expect(h.past[0][0][0]).toBe('a');
    expect(h.present[0][0]).toBe('b');
    expect(h.future).toHaveLength(0);
  });

  it('undoHistory moves last past to present and pushes old present to future', () => {
    const g1 = makeGrid('a');
    const g2 = makeGrid('b');

    let h = createInitialHistory(g1);
    h = applyChange(h, g2);

    const undone = undoHistory(h);
    expect(undone.present[0][0]).toBe('a');
    expect(undone.future).toHaveLength(1);
    expect(undone.future[0][0][0]).toBe('b');
  });

  it('redoHistory moves first future to present and pushes old present to past', () => {
    const g1 = makeGrid('a');
    const g2 = makeGrid('b');

    let h = createInitialHistory(g1);
    h = applyChange(h, g2);

    const undone = undoHistory(h);
    const redone = redoHistory(undone);

    expect(redone.present[0][0]).toBe('b');
    expect(redone.past.length).toBeGreaterThan(0);
  });
});
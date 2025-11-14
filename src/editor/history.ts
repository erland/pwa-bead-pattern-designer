// src/editor/history.ts
import type { BeadGrid } from './tools';
import { cloneGrid } from './tools';

export interface HistoryState {
  past: BeadGrid[];
  present: BeadGrid;
  future: BeadGrid[];
}

/** Initialize history with an initial grid as present (no past/future). */
export function createInitialHistory(initialGrid: BeadGrid): HistoryState {
  return {
    past: [],
    present: cloneGrid(initialGrid),
    future: [],
  };
}

/** Apply a new grid: push current present into past, clear future, set present=newGrid. */
export function applyChange(history: HistoryState, newGrid: BeadGrid): HistoryState {
  return {
    past: [...history.past, cloneGrid(history.present)],
    present: cloneGrid(newGrid),
    future: [],
  };
}

/** Undo: move last past into present; push old present into future. */
export function undoHistory(history: HistoryState): HistoryState {
  if (history.past.length === 0) return history;

  const newPast = history.past.slice(0, -1);
  const previous = history.past[history.past.length - 1];

  return {
    past: newPast,
    present: cloneGrid(previous),
    future: [cloneGrid(history.present), ...history.future],
  };
}

/** Redo: move first future into present; push old present into past. */
export function redoHistory(history: HistoryState): HistoryState {
  if (history.future.length === 0) return history;

  const [next, ...restFuture] = history.future;

  return {
    past: [...history.past, cloneGrid(history.present)],
    present: cloneGrid(next),
    future: restFuture.map(cloneGrid),
  };
}
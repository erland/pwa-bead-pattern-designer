// src/editor/usePatternHistory.ts
import { useState, useCallback } from 'react';
import { cloneGrid, type BeadGrid } from './tools';
import {
  createInitialHistory,
  applyChange,
  undoHistory,
  redoHistory,
  type HistoryState,
} from './history';
import type { BeadPattern } from '../domain/patterns';
import { useBeadStore } from '../store/beadStore';

export function usePatternHistory(pattern: BeadPattern | null) {
  const store = useBeadStore();
  // PatternEditor is keyed by pattern id. Initialize the history once on mount,
  // not whenever the persisted grid changes during editing.
  const [history, setHistory] = useState<HistoryState | null>(() =>
    pattern ? createInitialHistory(cloneGrid(pattern.grid)) : null,
  );

  const getCurrentGrid = useCallback(
    (): BeadGrid => (history ? history.present : pattern?.grid ?? []),
    [history, pattern],
  );

  const applyHistoryChange = useCallback(
    (fn: (grid: BeadGrid) => BeadGrid) => {
      if (!pattern) return;

      setHistory((prev) => {
        const baseGrid = prev ? prev.present : cloneGrid(pattern.grid);
        const nextGrid = fn(baseGrid);
        if (nextGrid === baseGrid) {
          return prev ?? createInitialHistory(cloneGrid(baseGrid));
        }

        const nextHistory = applyChange(
          prev ?? createInitialHistory(cloneGrid(baseGrid)),
          cloneGrid(nextGrid),
        );

        store.updatePattern(pattern.id, { grid: cloneGrid(nextGrid) });
        return nextHistory;
      });
    },
    [pattern, store],
  );

  const canUndo = !!history && history.past.length > 0;
  const canRedo = !!history && history.future.length > 0;

  const undo = useCallback(() => {
    if (!history || !pattern) return;
    const next = undoHistory(history);
    setHistory(next);
    store.updatePattern(pattern.id, { grid: cloneGrid(next.present) });
  }, [history, pattern, store]);

  const redo = useCallback(() => {
    if (!history || !pattern) return;
    const next = redoHistory(history);
    setHistory(next);
    store.updatePattern(pattern.id, { grid: cloneGrid(next.present) });
  }, [history, pattern, store]);

  return { history, getCurrentGrid, applyHistoryChange, canUndo, canRedo, undo, redo };
}
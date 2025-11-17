// src/editor/usePatternHistory.ts
import { useEffect, useState, useCallback } from 'react';
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

export function usePatternHistory(pattern: BeadPattern | null, patternId: string | null) {
  const store = useBeadStore();
  const [history, setHistory] = useState<HistoryState | null>(null);

  // Reset when we switch to a *different* pattern id,
  // but do NOT reset on every grid update.
  useEffect(() => {
    if (!pattern) {
      setHistory(null);
      return;
    }
    setHistory(createInitialHistory(cloneGrid(pattern.grid)));
  }, [patternId]); // <-- removed `pattern` here

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
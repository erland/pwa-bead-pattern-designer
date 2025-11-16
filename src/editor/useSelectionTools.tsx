// src/editor/useSelectionTools.ts
import { useState, useCallback } from 'react';
import type { CellRect, BeadGrid } from './tools';
import { normaliseRect, copyRegion, clearRegion, pasteRegion, moveRegion } from './tools';

export function useSelectionTools(
  getCurrentGrid: () => BeadGrid,
  applyHistoryChange: (fn: (g: BeadGrid) => BeadGrid) => void,
) {
  const [selectionRect, setSelectionRect] = useState<CellRect | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ x: number; y: number } | null>(null);
  const [clipboard, setClipboard] = useState<BeadGrid | null>(null);

  const beginSelection = useCallback((x: number, y: number) => {
    const anchor = { x, y };
    setSelectionAnchor(anchor);
    setSelectionRect({ x, y, width: 1, height: 1 });
  }, []);

  const updateSelection = useCallback(
    (x: number, y: number) => {
      if (!selectionAnchor) return;
      setSelectionRect(normaliseRect(selectionAnchor.x, selectionAnchor.y, x, y));
    },
    [selectionAnchor],
  );

  const clearSelection = useCallback(() => {
    setSelectionRect(null);
    setSelectionAnchor(null);
  }, []);

  const copySelection = useCallback(() => {
    if (!selectionRect) return;
    const region = copyRegion(getCurrentGrid(), selectionRect);
    setClipboard(region);
  }, [selectionRect, getCurrentGrid]);

  const cutSelection = useCallback(() => {
    if (!selectionRect) return;
    const grid = getCurrentGrid();
    const region = copyRegion(grid, selectionRect);
    setClipboard(region);
    applyHistoryChange((g) => clearRegion(g, selectionRect));
  }, [selectionRect, getCurrentGrid, applyHistoryChange]);

  const pasteSelection = useCallback(() => {
    if (!clipboard || !selectionRect) return;
    applyHistoryChange((g) => pasteRegion(g, selectionRect.x, selectionRect.y, clipboard));
  }, [clipboard, selectionRect, applyHistoryChange]);

  const clearSelectionCells = useCallback(() => {
    if (!selectionRect) return;
    applyHistoryChange((g) => clearRegion(g, selectionRect));
  }, [selectionRect, applyHistoryChange]);

  const nudgeSelectionRight = useCallback(() => {
    if (!selectionRect) return;
    applyHistoryChange((g) => moveRegion(g, selectionRect, 1, 0));
    setSelectionRect((prev) => (prev ? { ...prev, x: prev.x + 1 } : prev));
  }, [selectionRect, applyHistoryChange]);

  return {
    selectionRect,
    selectionAnchor,
    clipboard,
    beginSelection,
    updateSelection,
    clearSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    clearSelectionCells,
    nudgeSelectionRight,
    setSelectionRect, // if you still need manual tweaks
    setSelectionAnchor,
    setClipboard,
  };
}
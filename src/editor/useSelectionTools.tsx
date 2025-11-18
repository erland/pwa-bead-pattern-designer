// src/editor/useSelectionTools.ts
import { useState, useCallback, useEffect } from 'react';
import type { CellRect, BeadGrid } from './tools';
import {
  normaliseRect,
  copyRegion,
  clearRegion,
  pasteRegion,
  moveRegion,
} from './tools';
import {
  getSelectionClipboard,
  setSelectionClipboard,
  subscribeSelectionClipboard,
} from './selectionClipboard';

/**
 * Hook that encapsulates selection rectangle, anchor point, and
 * a *global* clipboard shared between all PatternEditor instances.
 *
 * The API matches what PatternEditor already expects, but internally
 * the clipboard lives in a module-level singleton so that you can:
 * - Copy in pattern A
 * - Switch to pattern/group B
 * - Paste the same region there
 */
export function useSelectionTools(
  getCurrentGrid: () => BeadGrid,
  applyHistoryChange: (fn: (g: BeadGrid) => BeadGrid) => void,
) {
  const [selectionRect, setSelectionRect] = useState<CellRect | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ x: number; y: number } | null>(null);
  const [clipboard, setClipboardState] = useState<BeadGrid | null>(() => getSelectionClipboard());

  // Keep local clipboard state in sync with the global clipboard so the
  // sidebar can enable/disable the Paste button correctly.
  useEffect(() => {
    const unsubscribe = subscribeSelectionClipboard(() => {
      setClipboardState(getSelectionClipboard());
    });
    return unsubscribe;
  }, []);

  // Start a new selection at the given cell.
  const beginSelection = useCallback((x: number, y: number) => {
    const anchor = { x, y };
    setSelectionAnchor(anchor);
    setSelectionRect({ x, y, width: 1, height: 1 });
  }, []);

  // Update selection rectangle while dragging.
  const updateSelection = useCallback(
    (x: number, y: number) => {
      if (!selectionAnchor) return;
      const rect = normaliseRect(selectionAnchor.x, selectionAnchor.y, x, y);
      setSelectionRect(rect);
    },
    [selectionAnchor],
  );

  const clearSelection = useCallback(() => {
    setSelectionAnchor(null);
    setSelectionRect(null);
  }, []);

  // Copy the currently selected region into the *global* clipboard.
  const copySelection = useCallback(() => {
    if (!selectionRect) return;
    const grid = getCurrentGrid();
    const region = copyRegion(grid, selectionRect);
    setSelectionClipboard(region);
  }, [selectionRect, getCurrentGrid]);

  // Cut = copy to global clipboard + clear cells inside selection.
  const cutSelection = useCallback(() => {
    if (!selectionRect) return;
    const grid = getCurrentGrid();
    const region = copyRegion(grid, selectionRect);
    setSelectionClipboard(region);
    applyHistoryChange((g) => clearRegion(g, selectionRect));
  }, [selectionRect, getCurrentGrid, applyHistoryChange]);

  // Paste from global clipboard into the currently selected rect's top-left.
  const pasteSelection = useCallback(() => {
    const clip = getSelectionClipboard();
    if (!clip || !selectionRect) return;
    applyHistoryChange((g) => pasteRegion(g, selectionRect.x, selectionRect.y, clip));
  }, [selectionRect, applyHistoryChange]);

  const clearSelectionCells = useCallback(() => {
    if (!selectionRect) return;
    applyHistoryChange((g) => clearRegion(g, selectionRect));
  }, [selectionRect, applyHistoryChange]);

  // Simple "nudge right" convenience: move region by +1 in x, keeping
  // the selection rectangle visually in sync.
  const nudgeSelectionRight = useCallback(() => {
    if (!selectionRect) return;
    const rect = selectionRect;
    applyHistoryChange((g) => moveRegion(g, rect, 1, 0));
    setSelectionRect({ ...rect, x: rect.x + 1 });
    setSelectionAnchor((anchor) =>
      anchor ? { x: anchor.x + 1, y: anchor.y } : anchor,
    );
  }, [selectionRect, applyHistoryChange]);

  // Expose a setter that writes to the *global* clipboard. PatternEditor
  // currently calls setClipboard(null) when the patternId changes; with
  // cross-pattern clipboard enabled you probably want to remove that call,
  // but we keep this API for compatibility.
  const setClipboard = useCallback((next: BeadGrid | null) => {
    setSelectionClipboard(next);
  }, []);

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
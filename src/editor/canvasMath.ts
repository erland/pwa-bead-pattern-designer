// src/editor/canvasMath.ts

export interface CanvasLayoutInput {
  canvasWidth: number;
  canvasHeight: number;
  cols: number;
  rows: number;
  zoom: number;
  panX?: number;
  panY?: number;
}

export interface CanvasLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

/**
 * Compute how the logical grid (cols × rows) maps to canvas pixels.
 * - cellSize is chosen so the whole board fits inside canvas, then scaled by zoom.
 * - originX/Y centers the board and applies pan offsets (in pixels).
 */
export function computeCanvasLayout(input: CanvasLayoutInput): CanvasLayout {
  const { canvasWidth, canvasHeight, cols, rows, zoom, panX = 0, panY = 0 } = input;

  if (cols <= 0 || rows <= 0 || canvasWidth <= 0 || canvasHeight <= 0 || zoom <= 0) {
    return {
      cellSize: 0,
      boardWidth: 0,
      boardHeight: 0,
      originX: 0,
      originY: 0,
    };
  }

  const baseCellSize = Math.min(canvasWidth / cols, canvasHeight / rows);
  const cellSize = baseCellSize * zoom;

  const boardWidth = cellSize * cols;
  const boardHeight = cellSize * rows;

  const originX = (canvasWidth - boardWidth) / 2 + panX;
  const originY = (canvasHeight - boardHeight) / 2 + panY;

  return {
    cellSize,
    boardWidth,
    boardHeight,
    originX,
    originY,
  };
}

/**
 * Convert canvas pixel coordinates into grid coordinates.
 * Returns null if the point is outside the board.
 */
export function screenToCell(
  px: number,
  py: number,
  layout: CanvasLayout,
  cols: number,
  rows: number,
): { x: number; y: number } | null {
  if (layout.cellSize <= 0) return null;

  const xInBoard = px - layout.originX;
  const yInBoard = py - layout.originY;

  if (xInBoard < 0 || yInBoard < 0) return null;

  const col = Math.floor(xInBoard / layout.cellSize);
  const row = Math.floor(yInBoard / layout.cellSize);

  if (col < 0 || row < 0 || col >= cols || row >= rows) {
    return null;
  }

  return { x: col, y: row };
}
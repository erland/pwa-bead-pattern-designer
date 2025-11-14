// src/editor/PatternCanvas.tsx
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { BeadPattern } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import { isCellInShape } from '../domain/shapes';
import type { BeadPalette, BeadColor } from '../domain/colors';
import type { EditorUiState } from '../domain/uiState';
import { computeCanvasLayout, screenToCell, type CanvasLayout } from './canvasMath';

export interface PatternCanvasProps {
  pattern: BeadPattern;
  shape: PegboardShape;
  palette: BeadPalette;
  editorState: EditorUiState;
  onCellPointerDown?: (x: number, y: number) => void;
}

type Size = { width: number; height: number };

function findColor(palette: BeadPalette, id: string | null): BeadColor | null {
  if (!id) return null;
  return palette.colors.find((c) => c.id === id) ?? null;
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  layout: CanvasLayout,
  pattern: BeadPattern,
  shape: PegboardShape,
  palette: BeadPalette,
  editorState: EditorUiState,
) {
  const { cols, rows, grid } = pattern;
  const { cellSize, originX, originY, boardWidth, boardHeight } = layout;

  // Clear
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background behind board
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(originX, originY, boardWidth, boardHeight);

  // Draw cells
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cx = originX + x * cellSize;
      const cy = originY + y * cellSize;
      const valid = isCellInShape(shape, x, y);

      const cellValue = grid[y]?.[x] ?? null;
      const color = findColor(palette, cellValue);

      if (!valid) {
        // Disabled cell (mask=false)
        ctx.fillStyle = '#e5e5e5';
        ctx.fillRect(cx, cy, cellSize, cellSize);
        if (editorState.gridVisible) {
          ctx.strokeStyle = '#d0d0d0';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1);
        }
        continue;
      }

      // Valid board background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy, cellSize, cellSize);

      // Bead circle
      if (color) {
        const radius = (cellSize * 0.8) / 2;
        const centerX = cx + cellSize / 2;
        const centerY = cy + cellSize / 2;

        const { r, g, b } = color.rgb;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // Simple outline
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Optional grid overlay
  if (editorState.gridVisible) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= cols; x += 1) {
      const lx = originX + x * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(lx, originY);
      ctx.lineTo(lx, originY + boardHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y += 1) {
      const ly = originY + y * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(originX, ly);
      ctx.lineTo(originX + boardWidth, ly);
      ctx.stroke();
    }
  }
}

export function PatternCanvas(props: PatternCanvasProps) {
  const { pattern, shape, palette, editorState, onCellPointerDown } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  // For freehand drawing (drag-to-draw)
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    // Basic window resize listener (you can swap to ResizeObserver later)
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Draw whenever pattern / shape / palette / editorState / size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (size.width <= 0 || size.height <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size.width;
    canvas.height = size.height;

    const layout = computeCanvasLayout({
      canvasWidth: size.width,
      canvasHeight: size.height,
      cols: pattern.cols,
      rows: pattern.rows,
      zoom: editorState.zoom,
      panX: editorState.panX,
      panY: editorState.panY,
    });

    drawPattern(ctx, layout, pattern, shape, palette, editorState);
  }, [pattern, shape, palette, editorState, size]);

  const getCellFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    const layout = computeCanvasLayout({
      canvasWidth: size.width,
      canvasHeight: size.height,
      cols: pattern.cols,
      rows: pattern.rows,
      zoom: editorState.zoom,
      panX: editorState.panX,
      panY: editorState.panY,
    });

    const cell = screenToCell(px, py, layout, pattern.cols, pattern.rows);
    if (!cell) return null;

    // IMPORTANT: ignore masked-out cells
    if (!isCellInShape(shape, cell.x, cell.y)) {
      return null;
    }

    return cell;
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!onCellPointerDown) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;

    const cell = getCellFromEvent(event);
    if (!cell) return;

    lastCellRef.current = cell;
    onCellPointerDown(cell.x, cell.y);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!onCellPointerDown) return;
    if (!isDrawingRef.current) return;

    const cell = getCellFromEvent(event);
    if (!cell) return;

    const last = lastCellRef.current;
    if (last && last.x === cell.x && last.y === cell.y) {
      return;
    }

    lastCellRef.current = cell;
    onCellPointerDown(cell.x, cell.y);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    isDrawingRef.current = false;
    lastCellRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={containerRef} className="pattern-canvas-container">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
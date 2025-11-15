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
type ClientPoint = { clientX: number; clientY: number };

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

  const isInteractive = !!onCellPointerDown;

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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

  // Shared helper: given clientX/clientY, figure out board cell.
  const getCellFromClientPoint = (point: ClientPoint) => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const px = point.clientX - rect.left;
    const py = point.clientY - rect.top;

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

    if (!isCellInShape(shape, cell.x, cell.y)) {
      return null;
    }

    return cell;
  };

  const startDrawingAtPoint = (point: ClientPoint) => {
    if (!onCellPointerDown) return;

    const cell = getCellFromClientPoint(point);
    if (!cell) return;

    isDrawingRef.current = true;
    lastCellRef.current = cell;
    onCellPointerDown(cell.x, cell.y);
  };

  const continueDrawingAtPoint = (point: ClientPoint) => {
    if (!onCellPointerDown) return;
    if (!isDrawingRef.current) return;

    const cell = getCellFromClientPoint(point);
    if (!cell) return;

    const last = lastCellRef.current;
    if (last && last.x === cell.x && last.y === cell.y) return;

    lastCellRef.current = cell;
    onCellPointerDown(cell.x, cell.y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  };

  // ─────────────────────────────────────────────
  // Pointer events (mouse + pen; we ignore touch here)
  // ─────────────────────────────────────────────
  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isInteractive) return;

    // If this is a touch pointer, let the native touch listeners handle it.
    if (event.pointerType === 'touch') {
      return;
    }

    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // some mobile browsers can throw; safe to ignore
    }

    startDrawingAtPoint({ clientX: event.clientX, clientY: event.clientY });
  };

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isInteractive) return;
    if (!isDrawingRef.current) return;
    if (event.pointerType === 'touch') return;

    event.preventDefault();
    continueDrawingAtPoint({ clientX: event.clientX, clientY: event.clientY });
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isInteractive) return;
    if (event.pointerType === 'touch') return;

    event.preventDefault();
    stopDrawing();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  // ─────────────────────────────────────────────
  // Native touch events (for iOS / nested layouts)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isInteractive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (ev: TouchEvent) => {
      if (!onCellPointerDown) return;
      if (ev.touches.length === 0) return;

      ev.preventDefault(); // requires passive: false

      const touch = ev.touches[0];
      startDrawingAtPoint({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const handleTouchMove = (ev: TouchEvent) => {
      if (!onCellPointerDown) return;
      if (!isDrawingRef.current) return;
      if (ev.touches.length === 0) return;

      ev.preventDefault();

      const touch = ev.touches[0];
      continueDrawingAtPoint({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const handleTouchEnd = (ev: TouchEvent) => {
      ev.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isInteractive, onCellPointerDown, pattern, shape, palette, editorState]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="pattern-canvas-container"
      style={{
        // Only block default gestures for interactive canvases
        touchAction: isInteractive ? 'none' : 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={isInteractive ? handlePointerDown : undefined}
        onPointerMove={isInteractive ? handlePointerMove : undefined}
        onPointerUp={isInteractive ? handlePointerUp : undefined}
        onPointerLeave={isInteractive ? handlePointerUp : undefined}
        onPointerCancel={isInteractive ? handlePointerUp : undefined}
        style={{
          touchAction: isInteractive ? 'none' : 'auto',
          pointerEvents: 'auto',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
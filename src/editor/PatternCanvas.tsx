// src/editor/PatternCanvas.tsx
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { BeadPattern, DimensionGuide } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import { isCellInShape } from '../domain/shapes';
import type { BeadPalette, BeadColor, BeadColorId } from '../domain/colors';
import type { EditorUiState } from '../domain/uiState';
import {
  computeCanvasLayout,
  screenToCell,
  type CanvasLayout,
} from './canvasMath';
import type { CellRect } from './tools';

export interface PatternCanvasProps {
  pattern: BeadPattern;
  shape: PegboardShape;
  palette: BeadPalette;
  editorState: EditorUiState;
  onCellPointerDown?: (x: number, y: number) => void;
  onCellPointerMove?: (x: number, y: number) => void;
  selectionRect?: CellRect | null;

  /** Optional group-level dimension guides (e.g. wall height/width). */
  groupGuides?: DimensionGuide[];

  /** Allow callers to toggle drawing of guides (defaults to true). */
  showGuides?: boolean;

  /** Global color lookup so a pattern can use colors from multiple palettes. */
  colorsById: Map<BeadColorId, BeadColor>;
}

type Size = { width: number; height: number };
type ClientPoint = { clientX: number; clientY: number };

/**
 * Resolve a bead color:
 *  - First from the global colorsById map (supports multi-palette patterns)
 *  - Then fall back to the pattern's primary palette (legacy behavior)
 */
function findColor(
  palette: BeadPalette,
  colorsById: Map<BeadColorId, BeadColor>,
  id: string | null,
): BeadColor | null {
  if (!id) return null;

  const fromMap = colorsById.get(id as BeadColorId);
  if (fromMap) return fromMap;

  return palette.colors.find((c) => c.id === id) ?? null;
}

function drawDimensionGuides(
  ctx: CanvasRenderingContext2D,
  layout: CanvasLayout,
  pattern: BeadPattern,
  guides: DimensionGuide[],
) {
  const { cellSize, originX, originY, boardWidth, boardHeight } = layout;
  const { cols, rows } = pattern;

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = Math.max(1, cellSize * 0.08);
  ctx.textBaseline = 'top';

  guides.forEach((guide, index) => {
    const stroke = 'rgba(59, 130, 246, 0.85)'; // bluish, works on light/dark
    const label = guide.label || `Guide ${index + 1}`;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;

    if (guide.axis === 'horizontal') {
      const offset = guide.cells;
      let rowIndex: number;
      if (guide.reference === 'top') {
        rowIndex = Math.max(0, Math.min(rows, offset));
      } else {
        // bottom (and any unexpected value) measured from bottom edge
        rowIndex = Math.max(0, Math.min(rows, rows - offset));
      }

      const y = originY + rowIndex * cellSize + 0.5;

      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + boardWidth, y);
      ctx.stroke();

      ctx.font = `${Math.max(10, cellSize * 0.6)}px system-ui`;
      ctx.fillText(label, originX + 4, y + 2);
    } else {
      const offset = guide.cells;
      let colIndex: number;
      if (guide.reference === 'left') {
        colIndex = Math.max(0, Math.min(cols, offset));
      } else {
        // right (and any unexpected value) measured from right edge
        colIndex = Math.max(0, Math.min(cols, cols - offset));
      }

      const x = originX + colIndex * cellSize + 0.5;

      ctx.beginPath();
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY + boardHeight);
      ctx.stroke();

      ctx.font = `${Math.max(10, cellSize * 0.6)}px system-ui`;

      // Draw label rotated along the line
      ctx.save();
      ctx.translate(x + 2, originY + 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  });

  ctx.restore();
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  layout: CanvasLayout,
  pattern: BeadPattern,
  shape: PegboardShape,
  palette: BeadPalette,
  editorState: EditorUiState,
  selectionRect: CellRect | null,
  groupGuides: DimensionGuide[] | undefined,
  colorsById: Map<BeadColorId, BeadColor>,
) {
  const { cols, rows, grid } = pattern;
  const { cellSize, originX, originY, boardWidth, boardHeight } = layout;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background behind board
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(originX, originY, boardWidth, boardHeight);

  // Cells
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cx = originX + x * cellSize;
      const cy = originY + y * cellSize;
      const valid = isCellInShape(shape, x, y);

      const cellValue = grid[y]?.[x] ?? null;
      const color = findColor(palette, colorsById, cellValue);

      if (!valid) {
        ctx.fillStyle = '#e5e5e5';
        ctx.fillRect(cx, cy, cellSize, cellSize);
        if (editorState.gridVisible) {
          ctx.strokeStyle = '#d0d0d0';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1);
        }
        continue;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy, cellSize, cellSize);

      if (color) {
        const centerX = cx + cellSize / 2;
        const centerY = cy + cellSize / 2;

        // Outer radius = 80% of cell, like before
        const outerRadius = (cellSize * 0.8) / 2;
        // Inner radius = hole in the bead (tweak 0.45–0.6 to taste)
        const innerRadius = outerRadius * 0.5;

        const { r, g, b } = color.rgb;

        // --- Outer colored disc ---
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // Optional outer edge for a bit of definition
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = Math.max(1, cellSize * 0.04);
        ctx.stroke();

        // --- Inner hole (same as cell background, currently white) ---
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // Tiny inner shadow for “depth”
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = Math.max(0.5, cellSize * 0.03);
        ctx.stroke();
      }
    }
  }

  // Grid overlay
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

  // Group-level dimension guides (wall height/width etc)
  if (groupGuides && groupGuides.length > 0) {
    drawDimensionGuides(ctx, layout, pattern, groupGuides);
  }

  // Selection overlay (if any)
  if (selectionRect) {
    const { x, y, width, height } = selectionRect;
    const sx = originX + x * cellSize;
    const sy = originY + y * cellSize;
    const sw = width * cellSize;
    const sh = height * cellSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'; // cyan-ish border
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);
    ctx.restore();
  }
}

export function PatternCanvas(props: PatternCanvasProps) {
  const {
    pattern,
    shape,
    palette,
    editorState,
    onCellPointerDown,
    onCellPointerMove,
    selectionRect = null,
    groupGuides,
    showGuides = true,
    colorsById,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);
  const isInteractive = !!onCellPointerDown || !!onCellPointerMove;

  // Measure container size (and keep it in sync when the container changes size)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          setSize({ width: cr.width, height: cr.height });
        }
      });
      ro.observe(container);
    }

    const handleWindowResize = () => updateSize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (ro) {
        ro.disconnect();
      }
    };
  }, []);

  // Draw whenever pattern / shape / palette / editorState / size / selectionRect change
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

    drawPattern(
      ctx,
      layout,
      pattern,
      shape,
      palette,
      editorState,
      selectionRect,
      showGuides ? groupGuides : undefined,
      colorsById,
    );
  }, [
    pattern,
    shape,
    palette,
    editorState,
    size,
    selectionRect,
    groupGuides,
    showGuides,
    colorsById,
  ]);

  // Cell mapping helpers
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
    if (!isCellInShape(shape, cell.x, cell.y)) return null;

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
    if (!isDrawingRef.current) return;

    const cell = getCellFromClientPoint(point);
    if (!cell) return;

    const last = lastCellRef.current;
    if (last && last.x === cell.x && last.y === cell.y) return;

    lastCellRef.current = cell;

    if (onCellPointerMove) {
      onCellPointerMove(cell.x, cell.y);
    } else if (onCellPointerDown) {
      // Fallback so drag-drawing still works if only "down" is wired
      onCellPointerDown(cell.x, cell.y);
    }
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  };

  // Pointer handlers (mouse / pen)
  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isInteractive) return;
    if (event.pointerType === 'touch') return; // touch is handled via touch events

    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore
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

  // Touch handlers (mobile)
  useEffect(() => {
    if (!isInteractive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 0) return;

      ev.preventDefault();
      const touch = ev.touches[0];
      startDrawingAtPoint({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const handleTouchMove = (ev: TouchEvent) => {
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
  }, [isInteractive, onCellPointerDown, onCellPointerMove, pattern, shape, palette, editorState]);

  return (
    <div
      ref={containerRef}
      className="pattern-canvas-container"
      style={{
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
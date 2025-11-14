// src/editor/PatternCanvas.tsx
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { BeadPattern } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
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

function buildColorMap(palette: BeadPalette): Record<string, BeadColor> {
  const map: Record<string, BeadColor> = {};
  for (const c of palette.colors) {
    map[c.id] = c;
  }
  return map;
}

export function PatternCanvas(props: PatternCanvasProps) {
  const { pattern, shape, palette, editorState, onCellPointerDown } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  // Track dragging state + last painted cell
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);

  // Track container size using ResizeObserver if available
  useEffect(() => {
    function updateSize() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }

    updateSize();

    const el = containerRef.current;
    if (!el) return;

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cols, rows } = pattern;

    canvas.width = size.width;
    canvas.height = size.height;

    const layout: CanvasLayout = computeCanvasLayout({
      canvasWidth: size.width,
      canvasHeight: size.height,
      cols,
      rows,
      zoom: editorState.zoom,
      panX: editorState.panX,
      panY: editorState.panY,
    });

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#020617'; // near black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const colorMap = buildColorMap(palette);

    // Draw board background
    ctx.save();
    ctx.translate(layout.originX, layout.originY);

    // Optional background board rectangle (slightly different by shape kind)
    const boardBg = shape.kind === 'circle' ? '#020617' : '#0f172a';
    ctx.fillStyle = boardBg;
    ctx.fillRect(0, 0, layout.boardWidth, layout.boardHeight);

    // Draw cells (beads)
    for (let y = 0; y < rows; y += 1) {
      const row = pattern.grid[y];
      for (let x = 0; x < cols; x += 1) {
        const beadId = row?.[x] ?? null;
        const cellX = x * layout.cellSize;
        const cellY = y * layout.cellSize;

        // grid lines
        if (editorState.gridVisible) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX, cellY, layout.cellSize, layout.cellSize);
        }

        if (!beadId) continue;
        const bead = colorMap[beadId];
        if (!bead) continue;

        const cx = cellX + layout.cellSize / 2;
        const cy = cellY + layout.cellSize / 2;
        const radius = (layout.cellSize * 0.75) / 2;

        const fill = `rgb(${bead.rgb.r}, ${bead.rgb.g}, ${bead.rgb.b})`;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        if (editorState.outlinesVisible) {
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [
    pattern,
    palette,
    editorState.zoom,
    editorState.panX,
    editorState.panY,
    editorState.gridVisible,
    editorState.outlinesVisible,
    size.width,
    size.height,
    shape.kind,
  ]);

  // Pointer handling
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

    return screenToCell(px, py, layout, pattern.cols, pattern.rows);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!onCellPointerDown) return;

    // Capture pointer so we keep getting events even if we leave the canvas
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
      // still in same cell, no need to re-apply the tool
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
      // ignore if we didn't have capture
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
// src/editor/__tests__/canvasMath.test.ts
import { computeCanvasLayout, screenToCell } from '../canvasMath';

describe('computeCanvasLayout', () => {
  it('computes centered layout with correct cell size', () => {
    const layout = computeCanvasLayout({
      canvasWidth: 200,
      canvasHeight: 100,
      cols: 10,
      rows: 5,
      zoom: 1,
    });

    expect(layout.cellSize).toBeCloseTo(20); // 200 / 10
    expect(layout.boardWidth).toBeCloseTo(200);
    expect(layout.boardHeight).toBeCloseTo(100);
    expect(layout.originX).toBeCloseTo(0);
    expect(layout.originY).toBeCloseTo(0);
  });

  it('applies zoom', () => {
    const layout = computeCanvasLayout({
      canvasWidth: 200,
      canvasHeight: 100,
      cols: 10,
      rows: 5,
      zoom: 2,
    });

    expect(layout.cellSize).toBeCloseTo(40);
    expect(layout.boardWidth).toBeCloseTo(400);
    expect(layout.boardHeight).toBeCloseTo(200);
  });

  it('applies pan offsets', () => {
    const layout = computeCanvasLayout({
      canvasWidth: 200,
      canvasHeight: 100,
      cols: 10,
      rows: 5,
      zoom: 1,
      panX: 10,
      panY: -5,
    });

    expect(layout.originX).toBeCloseTo(10);
    expect(layout.originY).toBeCloseTo(-5);
  });
});

describe('screenToCell', () => {
  it('maps canvas center to correct cell', () => {
    const layout = computeCanvasLayout({
      canvasWidth: 200,
      canvasHeight: 100,
      cols: 10,
      rows: 5,
      zoom: 1,
    });

    // cell (5, 2) should be around:
    const cellCenterX = layout.originX + layout.cellSize * (5 + 0.5);
    const cellCenterY = layout.originY + layout.cellSize * (2 + 0.5);

    const result = screenToCell(cellCenterX, cellCenterY, layout, 10, 5);
    expect(result).toEqual({ x: 5, y: 2 });
  });

  it('returns null for coordinates outside the board', () => {
    const layout = computeCanvasLayout({
      canvasWidth: 200,
      canvasHeight: 100,
      cols: 10,
      rows: 5,
      zoom: 1,
    });

    expect(screenToCell(-10, 10, layout, 10, 5)).toBeNull();
    expect(screenToCell(1000, 10, layout, 10, 5)).toBeNull();
    expect(screenToCell(10, 1000, layout, 10, 5)).toBeNull();
  });
});
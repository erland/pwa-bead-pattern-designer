// src/editor/__tests__/tools.test.ts
import { applyPencil, applyEraser, applyFill, type BeadGrid } from '../tools';

describe('editor tools', () => {
  it('applyPencil sets a single cell', () => {
    const grid: BeadGrid = [
      [null, null],
      [null, null],
    ];

    const result = applyPencil(grid, 1, 0, 'red');

    expect(result[0][1]).toBe('red');
    // original grid must be unchanged
    expect(grid[0][1]).toBeNull();
  });

  it('applyEraser clears a single cell', () => {
    const grid: BeadGrid = [
      ['red', 'blue'],
      ['green', null],
    ];

    const result = applyEraser(grid, 0, 0);
    expect(result[0][0]).toBeNull();
    expect(grid[0][0]).toBe('red');
  });

  it('applyFill fills a contiguous region of same color', () => {
    const grid: BeadGrid = [
      ['a', 'a', 'b'],
      ['a', 'b', 'b'],
      ['c', 'c', 'b'],
    ];

    const result = applyFill(grid, 0, 0, 'x');

    // Region of 'a' connected to (0,0) becomes 'x'
    expect(result[0][0]).toBe('x');
    expect(result[0][1]).toBe('x');
    expect(result[1][0]).toBe('x');

    // Other colors unchanged
    expect(result[0][2]).toBe('b');
    expect(result[1][1]).toBe('b');
    expect(result[2][0]).toBe('c');
  });

  it('applyFill does nothing if target equals new color', () => {
    const grid: BeadGrid = [
      ['a', 'a'],
      ['a', 'a'],
    ];

    const result = applyFill(grid, 0, 0, 'a');
    // Should be the exact same grid reference (we early return)
    expect(result).toBe(grid);
  });
});
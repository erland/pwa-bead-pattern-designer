// src/domain/__tests__/shapes.test.ts
import {
  createRectangleShape,
  createCircleShape,
  isCellInShape,
} from '../shapes';

describe('shape masks', () => {
  it('treats all cells as valid when mask is undefined', () => {
    const rect = createRectangleShape('rect', 'Rect', 4, 2, false);
    expect(isCellInShape(rect, 0, 0)).toBe(true);
    expect(isCellInShape(rect, 3, 1)).toBe(true);
    expect(isCellInShape(rect, -1, 0)).toBe(false);
    expect(isCellInShape(rect, 0, 2)).toBe(false);
  });

  it('circle has some invalid corner cells', () => {
    const circle = createCircleShape('c', 'Circle', 7);
    expect(isCellInShape(circle, 0, 0)).toBe(false); // corner
    const center = Math.floor(circle.cols / 2);
    expect(isCellInShape(circle, center, center)).toBe(true);
  });
});

describe('pegboard shape masks', () => {
  it('circle mask marks centre as valid and corners as invalid', () => {
    const diameter = 9;
    const shape = createCircleShape('circle-9', 'Circle 9', diameter);

    const centre = (diameter - 1) / 2;

    // centre should be valid
    expect(isCellInShape(shape, centre, centre)).toBe(true);

    // corners of the bounding box should be outside the circle
    expect(isCellInShape(shape, 0, 0)).toBe(false);
    expect(isCellInShape(shape, diameter - 1, 0)).toBe(false);
    expect(isCellInShape(shape, 0, diameter - 1)).toBe(false);
    expect(isCellInShape(shape, diameter - 1, diameter - 1)).toBe(false);
  });
});
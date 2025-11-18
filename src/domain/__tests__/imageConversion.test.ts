// src/domain/__tests__/imageConversion.test.ts
import type { BeadColor } from '../colors';
import { imageDataToBeadGrid, nearestPaletteColor } from '../imageConversion';

function makePalette(): BeadColor[] {
  return [
    {
      id: 'red',
      name: 'Red',
      paletteId: 'test',
      rgb: { r: 255, g: 0, b: 0 },
    },
    {
      id: 'green',
      name: 'Green',
      paletteId: 'test',
      rgb: { r: 0, g: 255, b: 0 },
    },
    {
      id: 'blue',
      name: 'Blue',
      paletteId: 'test',
      rgb: { r: 0, g: 0, b: 255 },
    },
  ];
}

/**
 * Minimal helper to create an ImageData-like object for tests.
 * We only need width, height and data; the actual constructor is not required.
 */
function makeImageData(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  const image = {
    width,
    height,
    data,
  } as unknown as ImageData;
  return { image, data };
}

describe('nearestPaletteColor', () => {
  it('picks the closest RGB color', () => {
    const palette = makePalette();
    const pixel = { r: 250, g: 10, b: 20 }; // very red-ish
    const nearest = nearestPaletteColor(pixel, palette);
    expect(nearest.id).toBe('red');
  });

  it('throws when palette is empty', () => {
    expect(() =>
      nearestPaletteColor({ r: 0, g: 0, b: 0 }, []),
    ).toThrow(/palette is empty/);
  });
});

describe('imageDataToBeadGrid', () => {
  it('maps a solid-color image to a single bead id', () => {
    const palette = makePalette();

    const width = 2;
    const height = 2;
    const { image, data } = makeImageData(width, height);

    // Solid reddish color
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 250; // R
      data[i + 1] = 10; // G
      data[i + 2] = 20; // B
      data[i + 3] = 255; // A
    }

    const result = imageDataToBeadGrid(image, palette, {
      cols: width,
      rows: height,
      maxColors: null,
      dithering: 'none',
    });

    expect(result.grid).toHaveLength(height);
    expect(result.grid[0]).toHaveLength(width);

    // All cells should be "red"
    const unique = new Set<string>();
    for (const row of result.grid) {
      for (const id of row) {
        unique.add(id);
      }
    }
    expect(unique.size).toBe(1);
    expect(Array.from(unique)[0]).toBe('red');
  });

  it('honours maxColors by limiting the number of distinct ids', () => {
    const palette = makePalette();

    const width = 2;
    const height = 1;
    const { image, data } = makeImageData(width, height);

    // Pixel 0: red-ish, Pixel 1: green-ish
    data[0] = 250;
    data[1] = 10;
    data[2] = 10;
    data[3] = 255;

    data[4] = 10;
    data[5] = 250;
    data[6] = 10;
    data[7] = 255;

    const result = imageDataToBeadGrid(image, palette, {
      cols: width,
      rows: height,
      maxColors: 1,
      dithering: 'none',
    });

    const unique = new Set<string>();
    for (const row of result.grid) {
      for (const id of row) {
        unique.add(id);
      }
    }

    expect(unique.size).toBe(1);
  });

  it('throws if ImageData size does not match cols/rows', () => {
    const palette = makePalette();
    const { image } = makeImageData(2, 2);

    expect(() =>
      imageDataToBeadGrid(image, palette, {
        cols: 3,
        rows: 2,
        maxColors: null,
        dithering: 'none',
      }),
    ).toThrow(/does not match options\.cols\/rows/);
  });
});
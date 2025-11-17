// src/editor/ShapePaletteSelector.tsx
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';

export interface ShapePaletteSelectorProps {
  shapeId: string;
  paletteId: string;
  shapes: Record<string, PegboardShape>;
  palettes: Record<string, BeadPalette>;
  onChangeShapeId: (id: string) => void;
  onChangePaletteId: (id: string) => void;
}

export function ShapePaletteSelector({
  shapeId,
  paletteId,
  shapes,
  palettes,
  onChangeShapeId,
  onChangePaletteId,
}: ShapePaletteSelectorProps) {
  return (
    <>
      <div className="new-pattern-dialog__field">
        <label>
          Shape:
          <select
            value={shapeId}
            onChange={(e) => onChangeShapeId(e.target.value)}
          >
            {Object.values(shapes).map((shape) => (
              <option key={shape.id} value={shape.id}>
                {shape.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="new-pattern-dialog__field">
        <label>
          Palette:
          <select
            value={paletteId}
            onChange={(e) => onChangePaletteId(e.target.value)}
          >
            {Object.values(palettes).map((palette) => (
              <option key={palette.id} value={palette.id}>
                {palette.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
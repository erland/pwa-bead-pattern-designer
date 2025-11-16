// src/editor/NewPatternPartDialog.tsx
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';

export interface NewPatternPartDialogProps {
  isOpen: boolean;
  shapeId: string;
  paletteId: string;
  shapes: Record<string, PegboardShape>;
  palettes: Record<string, BeadPalette>;
  onChangeShapeId: (id: string) => void;
  onChangePaletteId: (id: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NewPatternPartDialog({
  isOpen,
  shapeId,
  paletteId,
  shapes,
  palettes,
  onChangeShapeId,
  onChangePaletteId,
  onCancel,
  onConfirm,
}: NewPatternPartDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create New Pattern for Part</h2>

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

        <div className="new-pattern-dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
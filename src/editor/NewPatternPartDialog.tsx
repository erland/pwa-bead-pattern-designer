// src/editor/NewPatternPartDialog.tsx
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';
import { ShapePaletteSelector } from './ShapePaletteSelector';

export interface NewPatternPartDialogProps {
  isOpen: boolean;
  partName: string;
  onChangePartName: (value: string) => void;
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
  partName,
  onChangePartName,
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
        <h2>Create New Part</h2>

        <div className="new-pattern-dialog__field">
          <label>
            Part name:
            <input
              type="text"
              value={partName}
              onChange={(e) => onChangePartName(e.target.value)}
              placeholder="e.g. Front, Left wing"
            />
          </label>
        </div>

        <ShapePaletteSelector
          shapeId={shapeId}
          paletteId={paletteId}
          shapes={shapes}
          palettes={palettes}
          onChangeShapeId={onChangeShapeId}
          onChangePaletteId={onChangePaletteId}
        />

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
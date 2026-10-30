// src/routes/NewPatternDialog.tsx
import { useState } from 'react';
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';
import { ShapePaletteSelector } from '../editor/ShapePaletteSelector';

export interface NewPatternDialogProps {
  isOpen: boolean;
  shapes: Record<string, PegboardShape>;
  palettes: Record<string, BeadPalette>;
  onCancel: () => void;
  onCreate: (name: string, shapeId: string, paletteId: string) => void;
}

export function NewPatternDialog({
  isOpen,
  shapes,
  palettes,
  onCancel,
  onCreate,
}: NewPatternDialogProps) {
  if (!isOpen) return null;

  return (
    <NewPatternDialogContent
      shapes={shapes}
      palettes={palettes}
      onCancel={onCancel}
      onCreate={onCreate}
    />
  );
}

function NewPatternDialogContent({
  shapes,
  palettes,
  onCancel,
  onCreate,
}: Omit<NewPatternDialogProps, 'isOpen'>) {
  const [name, setName] = useState('');
  const [shapeId, setShapeId] = useState(() => Object.values(shapes)[0]?.id ?? '');
  const [paletteId, setPaletteId] = useState(() => Object.values(palettes)[0]?.id ?? '');

  const handleConfirm = () => {
    if (!shapeId || !paletteId) return;

    const finalName = name.trim() || 'New Pattern';
    onCreate(finalName, shapeId, paletteId);
  };

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create New Pattern</h2>

        <div className="new-pattern-dialog__field">
          <label>
            Pattern name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Space Invader, Heart"
            />
          </label>
        </div>

        <ShapePaletteSelector
          shapeId={shapeId}
          paletteId={paletteId}
          shapes={shapes}
          palettes={palettes}
          onChangeShapeId={setShapeId}
          onChangePaletteId={setPaletteId}
        />

        <div className="new-pattern-dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
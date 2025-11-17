// src/routes/NewPatternDialog.tsx
import React, { useEffect, useState } from 'react';
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';
import { ShapePaletteSelector } from '../editor/ShapePaletteSelector';

export interface NewPatternDialogProps {
  isOpen: boolean;
  shapes: Record<string, PegboardShape>;
  palettes: Record<string, BeadPalette>;
  onCancel: () => void;
  onCreate: (shapeId: string, paletteId: string) => void;
}

export function NewPatternDialog({
  isOpen,
  shapes,
  palettes,
  onCancel,
  onCreate,
}: NewPatternDialogProps) {
  const [shapeId, setShapeId] = useState<string>('');
  const [paletteId, setPaletteId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const firstShape = Object.values(shapes)[0];
    const firstPalette = Object.values(palettes)[0];

    setShapeId(firstShape?.id ?? '');
    setPaletteId(firstPalette?.id ?? '');
  }, [isOpen, shapes, palettes]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!shapeId || !paletteId) return;
    onCreate(shapeId, paletteId);
  };

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create New Pattern</h2>

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
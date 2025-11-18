// src/editor/PatternPaletteDialog.tsx
import { useMemo, useState, useEffect } from 'react';
import type { BeadPalette, BeadColor } from '../domain/colors';
import type { BeadPattern } from '../domain/patterns';
import { useBeadStore } from '../store/beadStore';
import './PatternPaletteDialog.css';

export interface PatternPaletteDialogProps {
  pattern: BeadPattern;
  palettes: Record<string, BeadPalette>;
  activeColors: BeadColor[];
  onClose: () => void;
}

export function PatternPaletteDialog({
  pattern,
  palettes,
  activeColors,
  onClose,
}: PatternPaletteDialogProps) {
  const store = useBeadStore();

  const [categoryId, setCategoryId] = useState<string>(pattern.paletteId);

  useEffect(() => {
    setCategoryId(pattern.paletteId);
  }, [pattern.id, pattern.paletteId]);

  const activeColorIds = useMemo(
    () => new Set(activeColors.map((c) => c.id)),
    [activeColors],
  );

  const category =
    palettes[categoryId] ??
    palettes[pattern.paletteId] ??
    Object.values(palettes)[0];

  const availableColors: BeadColor[] = useMemo(() => {
    if (!category) return [];
    return category.colors.filter((c) => !activeColorIds.has(c.id));
  }, [category, activeColorIds]);

  const handleAddColor = (colorId: string) => {
    store.addColorToPattern(pattern.id, colorId);
  };

  const handleRemoveColor = (colorId: string) => {
    store.removeColorFromPattern(pattern.id, colorId);
  };

  return (
    <div className="pattern-palette-dialog__backdrop">
      <div className="pattern-palette-dialog">
        <header className="pattern-palette-dialog__header">
          <h2>Pattern palette for “{pattern.name}”</h2>
          <button
            type="button"
            className="pattern-palette-dialog__close-button"
            onClick={onClose}
            aria-label="Close palette dialog"
          >
            ✕
          </button>
        </header>

        <div className="pattern-palette-dialog__body">
          <div className="pattern-palette-dialog__controls">
            <label className="pattern-palette-dialog__category-select">
              Category:{' '}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {Object.values(palettes).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pattern-palette-dialog__columns">
            <div className="pattern-palette-dialog__column">
              <h3>Available in category</h3>
              <div className="pattern-palette-dialog__grid">
                {availableColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className="pattern-palette-dialog__color"
                    onClick={() => handleAddColor(color.id)}
                    title={`${color.name} (${color.id})`}
                  >
                    <span
                      className="pattern-palette-dialog__swatch"
                      style={{
                        backgroundColor: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
                      }}
                    />
                    <span className="pattern-palette-dialog__label">
                      {color.name}
                    </span>
                  </button>
                ))}
                {availableColors.length === 0 && (
                  <p className="pattern-palette-dialog__empty">
                    All colors from this category are already in this pattern.
                  </p>
                )}
              </div>
            </div>

            <div className="pattern-palette-dialog__column">
              <h3>Colors in this pattern</h3>
              <div className="pattern-palette-dialog__grid">
                {activeColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className="pattern-palette-dialog__color pattern-palette-dialog__color--active"
                    onClick={() => handleRemoveColor(color.id)}
                    title={`Remove ${color.name} from this pattern`}
                  >
                    <span
                      className="pattern-palette-dialog__swatch"
                      style={{
                        backgroundColor: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
                      }}
                    />
                    <span className="pattern-palette-dialog__label">
                      {color.name}
                    </span>
                  </button>
                ))}
                {activeColors.length === 0 && (
                  <p className="pattern-palette-dialog__empty">
                    No colors selected yet – add from the list on the left.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="pattern-palette-dialog__footer">
          <button
            type="button"
            className="tool-button pattern-palette-dialog__close-button-main"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
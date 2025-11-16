// src/editor/PalettePanel.tsx
import type { BeadPalette } from '../domain/colors';

export interface PalettePanelProps {
  palette: BeadPalette;
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
}

export function PalettePanel({ palette, selectedColorId, onSelectColor }: PalettePanelProps) {
  return (
    <section className="palette-panel" aria-label="Palette">
      <div className="palette-panel__grid">
        {palette.colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          return (
            <button
              key={color.id}
              type="button"
              className={
                isSelected
                  ? 'palette-panel__swatch palette-panel__swatch--selected'
                  : 'palette-panel__swatch'
              }
              onClick={() => onSelectColor(color.id)}
              title={color.name}
              style={{
                backgroundColor: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
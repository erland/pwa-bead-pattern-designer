// src/editor/PalettePanel.tsx
import type { BeadPalette, BeadColor } from '../domain/colors';

export interface PalettePanelProps {
  palette: BeadPalette;
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
}

export function PalettePanel({ palette, selectedColorId, onSelectColor }: PalettePanelProps) {
  const handleClick = (color: BeadColor) => {
    onSelectColor(color.id);
  };

  return (
    <div className="palette-panel">
      <h2>Palette</h2>
      <div className="palette-panel__grid" aria-label={`Palette: ${palette.name}`}>
        {palette.colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          const style = {
            backgroundColor: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
          };
          return (
            <button
              key={color.id}
              type="button"
              className={`palette-panel__swatch${isSelected ? ' palette-panel__swatch--selected' : ''}`}
              style={style}
              onClick={() => handleClick(color)}
              title={color.name}
              aria-label={color.name}
            />
          );
        })}
      </div>
    </div>
  );
}
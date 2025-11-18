// src/routes/PatternPrintPage.tsx
import { useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import { computeBeadCounts } from '../domain/patterns';
import type { BeadColor } from '../domain/colors';
import { PatternCanvas } from '../editor/PatternCanvas';
import './PatternPrintPage.css';

const PRINT_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: true,
  outlinesVisible: true,
};

export function PatternPrintPage() {
  const { projectId } = useParams();
  const store = useBeadStore();

  const pattern = projectId ? store.patterns[projectId] : undefined;
  const shape = pattern ? store.shapes[pattern.shapeId] : undefined;
  const palette = pattern ? store.palettes[pattern.paletteId] : undefined;

  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  // Global color lookup: all colors from all palettes
  const colorsById = useMemo(() => {
    const map = new Map<string, BeadColor>();
    Object.values(store.palettes).forEach((p) => {
      p.colors.forEach((c) => map.set(c.id, c));
    });
    return map;
  }, [store.palettes]);

  // Mark body as "print-mode" while this page is mounted so we can
  // limit the printout only to this component.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('pattern-print-mode');
    return () => {
      document.body.classList.remove('pattern-print-mode');
    };
  }, []);

  const beadLegend = useMemo(() => {
    if (!pattern) return [];

    const counts = computeBeadCounts(pattern);
    const entries: { color: BeadColor | undefined; colorId: string; count: number }[] = [];

    Object.entries(counts).forEach(([colorId, count]) => {
      const color = colorsById.get(colorId);
      entries.push({ color, colorId, count });
    });

    const paletteColors = palette?.colors ?? [];

    // Sort primarily by order in the pattern's primary palette (if present),
    // otherwise by color name / colorId.
    entries.sort((a, b) => {
      const ia = a.color
        ? paletteColors.findIndex((c) => c.id === a.color!.id)
        : Number.MAX_SAFE_INTEGER;
      const ib = b.color
        ? paletteColors.findIndex((c) => c.id === b.color!.id)
        : Number.MAX_SAFE_INTEGER;

      if (ia !== ib) return ia - ib;

      const nameA = a.color?.name ?? '';
      const nameB = b.color?.name ?? '';
      if (nameA && nameB && nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }

      return a.colorId.localeCompare(b.colorId);
    });

    return entries;
  }, [pattern, palette, colorsById]);

  if (!projectId) {
    return (
      <div className="pattern-print pattern-print--fallback">
        <h1>Print Pattern</h1>
        <p>No pattern id provided.</p>
      </div>
    );
  }

  if (!pattern || !shape || !palette) {
    return (
      <div className="pattern-print pattern-print--fallback">
        <h1>Print Pattern</h1>
        <p>Pattern not found for id: {projectId}</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportData = {
      pattern,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const safeName = pattern.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName || 'pattern'}_${pattern.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) {
      // eslint-disable-next-line no-alert
      window.alert('Canvas not ready yet.');
      return;
    }
    const canvas = wrapper.querySelector('canvas');
    if (!canvas) {
      // eslint-disable-next-line no-alert
      window.alert('Canvas not found.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeName = pattern.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    link.href = dataUrl;
    link.download = `${safeName || 'pattern'}_${pattern.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pattern-print">
      <header className="pattern-print__header">
        <div>
          {/* Main caption = pattern name */}
          <h1 className="pattern-print__title">{pattern.name}</h1>
          <p className="pattern-print__subtitle">
            {pattern.cols} × {pattern.rows} &middot; Palette: {palette.name}
          </p>
        </div>
        <div className="pattern-print__actions">
          <button type="button" onClick={handlePrint}>
            Print
          </button>
          <button type="button" onClick={handleExportJson}>
            Export JSON
          </button>
          <button type="button" onClick={handleExportPng}>
            Export PNG
          </button>
        </div>
      </header>

      <div className="pattern-print__layout">
        <section className="pattern-print__pattern">
          <h2 className="pattern-print__section-title">Pattern</h2>
          <div ref={canvasWrapperRef} className="pattern-print__canvas-wrapper">
            <PatternCanvas
              pattern={pattern}
              shape={shape}
              palette={palette}
              editorState={PRINT_EDITOR_STATE}
              colorsById={colorsById}
            />
          </div>
        </section>

        <section className="pattern-print__legend">
          <h2 className="pattern-print__section-title">Bead Legend</h2>
          {beadLegend.length === 0 ? (
            <p className="pattern-print__legend-empty">No beads placed yet.</p>
          ) : (
            <table className="pattern-print__legend-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Name</th>
                  <th className="pattern-print__legend-count-header">Count</th>
                </tr>
              </thead>
              <tbody>
                {beadLegend.map(({ color, colorId, count }) => (
                  <tr key={colorId}>
                    <td>
                      <svg
                        className="pattern-print__legend-swatch"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="rgba(148, 163, 184, 0.7)"
                          strokeWidth="1"
                          fill={
                            color
                              ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
                              : 'transparent'
                          }
                        />
                      </svg>
                    </td>
                    <td>
                      {color?.name ?? '(Unknown color)'}
                      <div className="pattern-print__legend-color-id">{colorId}</div>
                    </td>
                    <td className="pattern-print__legend-count-cell">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
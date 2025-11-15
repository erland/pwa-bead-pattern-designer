import React, { useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import { computeBeadCounts } from '../domain/patterns';
import type { BeadColor } from '../domain/colors';
import { PatternCanvas } from '../editor/PatternCanvas';

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

  const beadLegend = useMemo(() => {
    if (!pattern || !palette) return [];
    const counts = computeBeadCounts(pattern);
    const entries: { color: BeadColor | undefined; colorId: string; count: number }[] = [];

    Object.entries(counts).forEach(([colorId, count]) => {
      const color = palette.colors.find((c) => c.id === colorId);
      entries.push({ color, colorId, count });
    });

    // Sort by palette order (index in palette.colors), fallback by colorId
    entries.sort((a, b) => {
      const ia = a.color
        ? palette.colors.findIndex((c) => c.id === a.color!.id)
        : Number.MAX_SAFE_INTEGER;
      const ib = b.color
        ? palette.colors.findIndex((c) => c.id === b.color!.id)
        : Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return a.colorId.localeCompare(b.colorId);
    });

    return entries;
  }, [pattern, palette]);

  if (!projectId) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1>Print Pattern</h1>
        <p>No pattern id provided.</p>
      </div>
    );
  }

  if (!pattern || !shape || !palette) {
    return (
      <div style={{ padding: '1rem' }}>
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
    const link = document.createElement('a');
    const safeName = pattern.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
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
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Print Pattern</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
            {pattern.name} &middot; {pattern.cols} × {pattern.rows} &middot; Palette: {palette.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1.5rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <section
          style={{
            flex: '2 1 320px',
            minWidth: '280px',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Pattern</h2>
          <div
            ref={canvasWrapperRef}
            style={{
              border: '1px solid rgba(148,163,184,0.4)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              background: 'var(--color-surface, #020617)',
            }}
          >
            <PatternCanvas
              pattern={pattern}
              shape={shape}
              palette={palette}
              editorState={PRINT_EDITOR_STATE}
            />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
            Rows: {pattern.rows}, Columns: {pattern.cols}. Use these as row/column indices when assembling.
          </p>
        </section>

        <section
          style={{
            flex: '1 1 220px',
            minWidth: '220px',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Bead Legend</h2>
          {beadLegend.length === 0 ? (
            <p style={{ fontSize: '0.9rem' }}>No beads placed yet.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Color</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '0.25rem' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {beadLegend.map(({ color, colorId, count }) => (
                  <tr key={colorId}>
                    <td style={{ padding: '0.25rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(148,163,184,0.7)',
                          backgroundColor: color
                            ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
                            : 'transparent',
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.25rem' }}>
                      {color?.name ?? '(Unknown color)'}
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{colorId}</div>
                    </td>
                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{count}</td>
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
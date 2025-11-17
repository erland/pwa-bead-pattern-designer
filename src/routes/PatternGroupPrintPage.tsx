// src/routes/PatternGroupPrintPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import { computeBeadCounts } from '../domain/patterns';
import type { BeadColor } from '../domain/colors';
import { PatternCanvas } from '../editor/PatternCanvas';
import './PatternGroupPrintPage.css';

const PRINT_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: true,
  outlinesVisible: true,
};

type LayoutMode = 'one-per-page' | 'two-per-page';

export function PatternGroupPrintPage() {
  const { groupId } = useParams();
  const store = useBeadStore();

  const group = groupId ? store.groups[groupId] : undefined;
  const patterns = store.patterns;
  const shapes = store.shapes;
  const palettes = store.palettes;

  // Mark body as "group print mode" while this page is mounted
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('pattern-group-print-mode');
    return () => {
      document.body.classList.remove('pattern-group-print-mode');
    };
  }, []);

  const initialSelected = useMemo(
    () => new Set(group?.parts.map((p) => p.id) ?? []),
    [group],
  );
  const [layout, setLayout] = useState<LayoutMode>('one-per-page');
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(initialSelected);

  const visibleParts = useMemo(
    () => (group ? group.parts.filter((p) => selectedPartIds.has(p.id)) : []),
    [group, selectedPartIds],
  );

  const handleTogglePart = (partId: string) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  if (!groupId) {
    return (
      <div className="group-print group-print--fallback">
        <h1>Print Pattern Group</h1>
        <p>No group id provided.</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-print group-print--fallback">
        <h1>Print Pattern Group</h1>
        <p>Group not found for id: {groupId}</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportGroupJson = () => {
    const includedParts = visibleParts.length > 0 ? visibleParts : group.parts;
    const includedPatternIds = new Set(includedParts.map((p) => p.patternId));
    const includedPatterns = Array.from(includedPatternIds)
      .map((id) => patterns[id])
      .filter(Boolean);

    const exportData = {
      group,
      patterns: includedPatterns,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = group.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeName || 'pattern-group'}_${group.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const containerStyle: React.CSSProperties = {
    display: 'block',
  };

  const partsToRender = visibleParts.length > 0 ? visibleParts : group.parts;

  return (
    <div className={`group-print group-print--layout-${layout}`}>
      <header className="group-print__header">
        <div>
          {/* Main caption = group name */}
          <h1 className="group-print__title">{group.name}</h1>
          <p className="group-print__subtitle">
            {group.parts.length} part{group.parts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="group-print__actions">
          <button type="button" onClick={handlePrint}>
            Print
          </button>
          <button type="button" onClick={handleExportGroupJson}>
            Export group JSON
          </button>
        </div>
      </header>

      <section className="group-print__body">
        {/* Left: selection + layout controls (screen only, hidden in print) */}
        <div className="group-print__sidebar">
          <h2>Parts to include</h2>
          <ul className="group-print__parts-list">
            {group.parts.map((part) => {
              const pattern = patterns[part.patternId];
              return (
                <li key={part.id} className="group-print__parts-list-item">
                  <label className="group-print__parts-list-label">
                    <input
                      type="checkbox"
                      checked={selectedPartIds.has(part.id)}
                      onChange={() => handleTogglePart(part.id)}
                    />
                    <span>
                      <strong>{part.name}</strong>
                      {pattern && (
                        <span className="group-print__parts-list-meta">
                          ({pattern.cols} × {pattern.rows})
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="group-print__layout-controls">
            <h3>Layout</h3>
            <label className="group-print__layout-option">
              <input
                type="radio"
                name="layout"
                value="one-per-page"
                checked={layout === 'one-per-page'}
                onChange={() => setLayout('one-per-page')}
              />
              One part per page
            </label>
            <label className="group-print__layout-option">
              <input
                type="radio"
                name="layout"
                value="two-per-page"
                checked={layout === 'two-per-page'}
                onChange={() => setLayout('two-per-page')}
              />
              Two parts per row
            </label>
          </div>

          <p className="group-print__layout-hint">
            Note: Actual page breaks depend on your printer settings. &quot;One
            part per page&quot; adds page breaks between parts to help keep
            them separated when printing.
          </p>
        </div>

        {/* Right: rendered parts */}
        <div className="group-print__content">
          {partsToRender.length === 0 ? (
            <p className="group-print__empty-message">
              Select at least one part to include in the printout.
            </p>
          ) : (
            <div style={containerStyle}>
              {partsToRender.map((part, index) => {
                const pattern = patterns[part.patternId];
                if (!pattern) {
                  return null;
                }
                const shape = shapes[pattern.shapeId];
                const palette = palettes[pattern.paletteId];
                if (!shape || !palette) {
                  return null;
                }

                const beadLegend = (() => {
                  const counts = computeBeadCounts(pattern);
                  const entries: {
                    color: BeadColor | undefined;
                    colorId: string;
                    count: number;
                  }[] = [];
                  Object.entries(counts).forEach(([colorId, count]) => {
                    const color = palette.colors.find((c) => c.id === colorId);
                    entries.push({ color, colorId, count });
                  });
                  entries.sort((a, b) => {
                    const ia = a.color
                      ? palette.colors.findIndex(
                          (c) => c.id === a.color!.id,
                        )
                      : Number.MAX_SAFE_INTEGER;
                    const ib = b.color
                      ? palette.colors.findIndex(
                          (c) => c.id === b.color!.id,
                        )
                      : Number.MAX_SAFE_INTEGER;
                    if (ia !== ib) return ia - ib;
                    return a.colorId.localeCompare(b.colorId);
                  });
                  return entries;
                })();

                const wrapperStyle: React.CSSProperties =
                  layout === 'one-per-page'
                    ? {
                        marginBottom: '2rem',
                      }
                    : {
                        marginBottom: '1.5rem',
                      };

                return (
                  <section
                    key={part.id}
                    className="group-print__part-section"
                    style={wrapperStyle}
                  >
                    <h2 className="group-print__part-title">{part.name}</h2>
                    <p className="group-print__part-subtitle">
                      {pattern.cols} × {pattern.rows} &middot; Palette:{' '}
                      {palette.name}
                    </p>

                    <div className="group-print__part-layout">
                      <div className="group-print__pattern-col">
                        <div className="group-print__canvas-wrapper">
                          <PatternCanvas
                            pattern={pattern}
                            shape={shape}
                            palette={palette}
                            editorState={PRINT_EDITOR_STATE}
                          />
                        </div>                  
                      </div>

                      <div className="group-print__legend-col">
                        <h3 className="group-print__legend-title">
                          Bead Legend
                        </h3>
                        {beadLegend.length === 0 ? (
                          <p className="group-print__legend-empty">
                            No beads placed yet.
                          </p>
                        ) : (
                          <table className="group-print__legend-table">
                            <thead>
                              <tr>
                                <th>Color</th>
                                <th>Name</th>
                                <th className="group-print__legend-count-header">
                                  Count
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {beadLegend.map(({ color, colorId, count }) => (
                                <tr key={colorId}>
                                  <td>
                                    <svg
                                      className="group-print__legend-swatch"
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
                                    <div className="group-print__legend-color-id">
                                      {colorId}
                                    </div>
                                  </td>
                                  <td className="group-print__legend-count-cell">
                                    {count}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
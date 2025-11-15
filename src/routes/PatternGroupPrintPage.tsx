import React, { useMemo, useState } from 'react';
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

type LayoutMode = 'one-per-page' | 'two-per-page' | 'grid';

export function PatternGroupPrintPage() {
  const { groupId } = useParams();
  const store = useBeadStore();

  const group = groupId ? store.groups[groupId] : undefined;
  const patterns = store.patterns;
  const shapes = store.shapes;
  const palettes = store.palettes;

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
      <div style={{ padding: '1rem' }}>
        <h1>Print Pattern Group</h1>
        <p>No group id provided.</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ padding: '1rem' }}>
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

  const containerStyle: React.CSSProperties =
    layout === 'one-per-page'
      ? {
          display: 'block',
        }
      : {
          display: 'grid',
          gridTemplateColumns:
            layout === 'two-per-page' ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        };

  const partsToRender = visibleParts.length > 0 ? visibleParts : group.parts;

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
          <h1 style={{ margin: 0 }}>Print Pattern Group</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
            {group.name} &middot; {group.parts.length} part{group.parts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handlePrint}>
            Print
          </button>
          <button type="button" onClick={handleExportGroupJson}>
            Export group JSON
          </button>
        </div>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left: selection + layout controls */}
        <div
          style={{
            minWidth: '220px',
            maxWidth: '320px',
            flex: '0 0 auto',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Parts to include</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '0.9rem' }}>
            {group.parts.map((part) => {
              const pattern = patterns[part.patternId];
              return (
                <li key={part.id} style={{ marginBottom: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedPartIds.has(part.id)}
                      onChange={() => handleTogglePart(part.id)}
                    />
                    <span>
                      <strong>{part.name}</strong>
                      {pattern && (
                        <span style={{ marginLeft: '0.25rem', opacity: 0.7, fontSize: '0.8rem' }}>
                          ({pattern.cols} × {pattern.rows})
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Layout</h3>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <input
                type="radio"
                name="layout"
                value="one-per-page"
                checked={layout === 'one-per-page'}
                onChange={() => setLayout('one-per-page')}
              />
              One part per page
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <input
                type="radio"
                name="layout"
                value="two-per-page"
                checked={layout === 'two-per-page'}
                onChange={() => setLayout('two-per-page')}
              />
              Two parts per row
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <input
                type="radio"
                name="layout"
                value="grid"
                checked={layout === 'grid'}
                onChange={() => setLayout('grid')}
              />
              Grid layout
            </label>
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.75 }}>
            Note: Actual page breaks depend on your printer settings. &quot;One part per page&quot; adds
            page breaks between parts to help keep them separated when printing.
          </p>
        </div>

        {/* Right: rendered parts */}
        <div style={{ flex: '1 1 0%' }}>
          {partsToRender.length === 0 ? (
            <p style={{ fontSize: '0.9rem' }}>
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
                  const entries: { color: BeadColor | undefined; colorId: string; count: number }[] =
                    [];
                  Object.entries(counts).forEach(([colorId, count]) => {
                    const color = palette.colors.find((c) => c.id === colorId);
                    entries.push({ color, colorId, count });
                  });
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
                })();

                const wrapperStyle: React.CSSProperties =
                  layout === 'one-per-page'
                    ? {
                        pageBreakAfter: index === partsToRender.length - 1 ? 'auto' : 'always',
                        marginBottom: '2rem',
                      }
                    : {
                        marginBottom: '1.5rem',
                      };

                return (
                  <section
                    key={part.id}
                    style={{
                      ...wrapperStyle,
                      border: '1px solid rgba(148,163,184,0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      background: 'var(--color-surface, #020617)',
                    }}
                  >
                    <h2 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>
                      {part.name}
                    </h2>
                    <p
                      style={{
                        marginTop: 0,
                        marginBottom: '0.5rem',
                        fontSize: '0.8rem',
                        opacity: 0.8,
                      }}
                    >
                      Pattern: {pattern.name} &middot; {pattern.cols} × {pattern.rows} &middot; Palette:{' '}
                      {palette.name}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          flex: '2 1 240px',
                          minWidth: '220px',
                        }}
                      >
                        <div
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
                        <p
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            opacity: 0.8,
                          }}
                        >
                          Size: {pattern.cols} × {pattern.rows}. Use these as row/column indices for assembly.
                        </p>
                      </div>

                      <div
                        style={{
                          flex: '1 1 200px',
                          minWidth: '200px',
                        }}
                      >
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: '0.25rem',
                            fontSize: '0.9rem',
                          }}
                        >
                          Bead Legend
                        </h3>
                        {beadLegend.length === 0 ? (
                          <p style={{ fontSize: '0.8rem' }}>No beads placed yet.</p>
                        ) : (
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '0.75rem',
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
                                        width: '1rem',
                                        height: '1rem',
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
                                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{colorId}</div>
                                  </td>
                                  <td style={{ padding: '0.25rem', textAlign: 'right' }}>{count}</td>
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
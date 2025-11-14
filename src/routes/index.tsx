// src/routes/index.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from '../editor/PatternCanvas';

export function HomePage() {
  const navigate = useNavigate();

  // 👇 selectors now return stable references (no Object.values inside)
  const patternsMap = useBeadStore((state) => state.patterns);
  const groupsMap = useBeadStore((state) => state.groups);
  const shapes = useBeadStore((state) => state.shapes);
  const palettes = useBeadStore((state) => state.palettes);
  const createPattern = useBeadStore((state) => state.createPattern);
  const createGroup = useBeadStore((state) => state.createGroup);

  // 👇 derive arrays outside the selector
  const patterns = Object.values(patternsMap);
  const groups = Object.values(groupsMap);

  const handleNewPattern = () => {
    const shape = Object.values(shapes)[0];
    const palette = Object.values(palettes)[0];
    if (!shape || !palette) return;

    const id = createPattern({
      name: 'New Pattern',
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
    });

    navigate(`/editor/${id}`);
  };

  const handleNewGroup = () => {
    const id = createGroup('New Pattern Group');
    navigate(`/group/${id}`);
  };

  return (
    <div className="home-page">
      <header className="home-header-row">
        <h1>Projects</h1>
        <div className="home-actions">
          <button type="button" onClick={handleNewPattern}>
            New Pattern
          </button>
          <button type="button" onClick={handleNewGroup}>
            New Pattern Group
          </button>
        </div>
      </header>

      <section className="home-section">
        <h2>Patterns</h2>
        {patterns.length === 0 ? (
          <p>No patterns yet. Create one to get started.</p>
        ) : (
          <ul className="home-list">
            {patterns.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => navigate(`/editor/${p.id}`)}>
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-section">
        <h2>Pattern Groups</h2>
        {groups.length === 0 ? (
          <p>No pattern groups yet.</p>
        ) : (
          <ul className="home-list">
            {groups.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => navigate(`/group/${g.id}`)}>
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function PatternEditorPage() {
  const { projectId } = useParams();

  // Read the entire store once; derive what we need from it.
  const store = useBeadStore();

  const pattern = projectId ? store.patterns[projectId] : undefined;
  const shape = pattern ? store.shapes[pattern.shapeId] : undefined;
  const palette = pattern ? store.palettes[pattern.paletteId] : undefined;

  const [editorState, setEditorState] = useState<EditorUiState>(() => ({
    selectedTool: 'pencil',
    selectedColorId: palette?.colors[0]?.id ?? null,
    zoom: 1,
    panX: 0,
    panY: 0,
    gridVisible: true,
    outlinesVisible: true,
  }));

  if (!projectId) {
    return (
      <div>
        <h1>Pattern Editor</h1>
        <p>No project id provided.</p>
      </div>
    );
  }

  if (!pattern || !shape || !palette) {
    return (
      <div>
        <h1>Pattern Editor</h1>
        <p>Pattern not found for id: {projectId}</p>
      </div>
    );
  }

  const handleZoomChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value) || 1;
    setEditorState((prev) => ({ ...prev, zoom: value }));
  };

  const handleGridToggle: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const checked = event.target.checked;
    setEditorState((prev) => ({ ...prev, gridVisible: checked }));
  };

  const handleOutlinesToggle: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const checked = event.target.checked;
    setEditorState((prev) => ({ ...prev, outlinesVisible: checked }));
  };

  const handleCellPointerDown = (x: number, y: number) => {
    if (!editorState.selectedColorId) return;

    const newGrid = pattern.grid.map((row, rowIndex) =>
      rowIndex === y ? row.map((cell, colIndex) => (colIndex === x ? editorState.selectedColorId : cell)) : row,
    );

    // Use the store's updatePattern action from the state object
    store.updatePattern(pattern.id, { grid: newGrid });
  };

  return (
    <div className="pattern-editor">
      <header className="pattern-editor__header">
        <h1>{pattern.name}</h1>
        <div className="pattern-editor__controls">
          <label>
            Zoom
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={editorState.zoom}
              onChange={handleZoomChange}
            />
          </label>
          <label>
            <input type="checkbox" checked={editorState.gridVisible} onChange={handleGridToggle} />
            Grid
          </label>
          <label>
            <input
              type="checkbox"
              checked={editorState.outlinesVisible}
              onChange={handleOutlinesToggle}
            />
            Outlines
          </label>
        </div>
      </header>
      <div className="pattern-editor__body">
        <div className="pattern-editor__canvas">
          <PatternCanvas
            pattern={pattern}
            shape={shape}
            palette={palette}
            editorState={editorState}
            onCellPointerDown={handleCellPointerDown}
          />
        </div>
        <aside className="pattern-editor__sidebar">
          <h2>Details</h2>
          <p>Shape: {shape.name}</p>
          <p>
            Size: {pattern.cols} × {pattern.rows}
          </p>
          <p>Palette: {palette.name}</p>
          <p className="pattern-editor__hint">
            Tip: Click on the grid to place beads using the default color. Palette and tool selection
            will be added in a later phase.
          </p>
        </aside>
      </div>
    </div>
  );
}

export function PatternGroupEditorPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Pattern Group Editor</h1>
      <p>Editing group: {groupId}</p>
    </div>
  );
}

export function ImageConvertPage() {
  return (
    <div>
      <h1>Image to Pattern</h1>
      <p>Placeholder for image upload & conversion.</p>
    </div>
  );
}

export function PatternPrintPage() {
  const { projectId } = useParams();
  return (
    <div>
      <h1>Print Pattern</h1>
      <p>Pattern ID: {projectId}</p>
    </div>
  );
}

export function PatternGroupPrintPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Print Pattern Group</h1>
      <p>Group ID: {groupId}</p>
    </div>
  );
}
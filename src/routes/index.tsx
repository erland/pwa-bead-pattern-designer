// src/routes/index.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import { isCellInShape } from '../domain/shapes';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from '../editor/PatternCanvas';
import { PalettePanel } from '../editor/PalettePanel';
import { applyPencil, applyEraser, applyFill, cloneGrid } from '../editor/tools';
import {
  createInitialHistory,
  applyChange,
  undoHistory,
  redoHistory,
  type HistoryState,
} from '../editor/history';

export function HomePage() {
  const navigate = useNavigate();

  // Store selectors with stable references
  const patternsMap = useBeadStore((state) => state.patterns);
  const groupsMap = useBeadStore((state) => state.groups);
  const shapes = useBeadStore((state) => state.shapes);
  const palettes = useBeadStore((state) => state.palettes);
  const createPattern = useBeadStore((state) => state.createPattern);
  const createGroup = useBeadStore((state) => state.createGroup);

  // Derived arrays for listing
  const patterns = Object.values(patternsMap);
  const groups = Object.values(groupsMap);

  // --- New Pattern dialog state ---
  const [isNewPatternDialogOpen, setIsNewPatternDialogOpen] = useState(false);
  const [dialogShapeId, setDialogShapeId] = useState<string>('');
  const [dialogPaletteId, setDialogPaletteId] = useState<string>('');

  const handleOpenNewPatternDialog = () => {
    const firstShape = Object.values(shapes)[0];
    const firstPalette = Object.values(palettes)[0];

    setDialogShapeId(firstShape?.id ?? '');
    setDialogPaletteId(firstPalette?.id ?? '');
    setIsNewPatternDialogOpen(true);
  };

  const handleCancelNewPattern = () => {
    setIsNewPatternDialogOpen(false);
  };

  const handleConfirmNewPattern = () => {
    const shape = dialogShapeId ? shapes[dialogShapeId] : undefined;
    const palette = dialogPaletteId ? palettes[dialogPaletteId] : undefined;
    if (!shape || !palette) {
      // Nothing to do if store isn't ready / user hasn't selected
      return;
    }

    const id = createPattern({
      name: 'New Pattern',
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
    });

    setIsNewPatternDialogOpen(false);
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
          <button type="button" onClick={handleOpenNewPatternDialog}>
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

      {/* Simple inline "dialog" for New Pattern */}
      {isNewPatternDialogOpen && (
        <div className="new-pattern-dialog-backdrop">
          <div className="new-pattern-dialog">
            <h2>Create New Pattern</h2>
            <div className="new-pattern-dialog__field">
              <label>
                Shape:
                <select
                  value={dialogShapeId}
                  onChange={(e) => setDialogShapeId(e.target.value)}
                >
                  {Object.values(shapes).map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="new-pattern-dialog__field">
              <label>
                Palette:
                <select
                  value={dialogPaletteId}
                  onChange={(e) => setDialogPaletteId(e.target.value)}
                >
                  {Object.values(palettes).map((palette) => (
                    <option key={palette.id} value={palette.id}>
                      {palette.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="new-pattern-dialog__actions">
              <button type="button" onClick={handleCancelNewPattern}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmNewPattern}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PatternEditorPage() {
  const { projectId } = useParams();

  // Read entire store once; derive what we need from it.
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

  const [history, setHistory] = useState<HistoryState | null>(null);

  // Initialize history once we have a pattern and no history yet
  useEffect(() => {
    if (pattern && !history) {
      setHistory(createInitialHistory(cloneGrid(pattern.grid)));
    }
  }, [pattern, history]);

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

  // Keep selectedColorId in sync if palette changes (e.g. initial load)
  useEffect(() => {
    if (!editorState.selectedColorId && palette.colors.length > 0) {
      setEditorState((prev) => ({
        ...prev,
        selectedColorId: palette.colors[0].id,
      }));
    }
  }, [palette, editorState.selectedColorId]);

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

  const handleSelectTool = (tool: EditorUiState['selectedTool']) => {
    setEditorState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleSelectColor = (colorId: string) => {
    setEditorState((prev) => ({ ...prev, selectedColorId: colorId }));
  };

  const applyToolAtCell = (x: number, y: number) => {
    if (!pattern || !shape) return;

    if (!isCellInShape(shape, x, y)) {
      return;
    }

    const currentGrid = pattern.grid;

    let newGrid = currentGrid;

    if (editorState.selectedTool === 'pencil') {
      if (!editorState.selectedColorId) return;
      newGrid = applyPencil(currentGrid, x, y, editorState.selectedColorId);
    } else if (editorState.selectedTool === 'eraser') {
      newGrid = applyEraser(currentGrid, x, y);
    } else if (editorState.selectedTool === 'fill') {
      if (!editorState.selectedColorId) return;
      newGrid = applyFill(currentGrid, x, y, editorState.selectedColorId);
    } else {
      // Other tools (line, rect, etc.) will be implemented in later phases
      return;
    }

    if (newGrid === currentGrid) {
      // No change (e.g. fill into same color)
      return;
    }

    setHistory((prev) => {
      if (!prev) {
        const initial = createInitialHistory(cloneGrid(currentGrid));
        return applyChange(initial, cloneGrid(newGrid));
      }
      return applyChange(prev, cloneGrid(newGrid));
    });

    store.updatePattern(pattern.id, { grid: newGrid });
  };

  const handleCellPointerDown = (x: number, y: number) => {
    applyToolAtCell(x, y);
  };

  const canUndo = !!history && history.past.length > 0;
  const canRedo = !!history && history.future.length > 0;

  const handleUndo = () => {
    if (!history || history.past.length === 0) return;
    const next = undoHistory(history);
    setHistory(next);
    store.updatePattern(pattern.id, { grid: cloneGrid(next.present) });
  };

  const handleRedo = () => {
    if (!history || history.future.length === 0) return;
    const next = redoHistory(history);
    setHistory(next);
    store.updatePattern(pattern.id, { grid: cloneGrid(next.present) });
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
          <div className="pattern-editor__tools">
            <div className="pattern-editor__tool-row">
              <button
                type="button"
                className={
                  editorState.selectedTool === 'pencil'
                    ? 'tool-button tool-button--active'
                    : 'tool-button'
                }
                onClick={() => handleSelectTool('pencil')}
              >
                ✏️ Pencil
              </button>
              <button
                type="button"
                className={
                  editorState.selectedTool === 'eraser'
                    ? 'tool-button tool-button--active'
                    : 'tool-button'
                }
                onClick={() => handleSelectTool('eraser')}
              >
                🧽 Eraser
              </button>
              <button
                type="button"
                className={
                  editorState.selectedTool === 'fill'
                    ? 'tool-button tool-button--active'
                    : 'tool-button'
                }
                onClick={() => handleSelectTool('fill')}
              >
                🪣 Fill
              </button>
            </div>

            <div className="pattern-editor__tool-row">
              <button
                type="button"
                className="tool-button"
                disabled={!canUndo}
                onClick={handleUndo}
              >
                ⬅️ Undo
              </button>
              <button
                type="button"
                className="tool-button"
                disabled={!canRedo}
                onClick={handleRedo}
              >
                ➡️ Redo
              </button>
            </div>
          </div>

          <PalettePanel
            palette={palette}
            selectedColorId={editorState.selectedColorId}
            onSelectColor={handleSelectColor}
          />

          <div className="pattern-editor__details">
            <h2>Details</h2>
            <p>Shape: {shape.name}</p>
            <p>
              Size: {pattern.cols} × {pattern.rows}
            </p>
            <p>Palette: {palette.name}</p>
            <p className="pattern-editor__hint">
              Tip: Choose a tool and color, then click the grid to draw. Undo/Redo lets you experiment
              freely.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

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
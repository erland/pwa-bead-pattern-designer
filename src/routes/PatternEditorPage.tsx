import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import { isCellInShape } from '../domain/shapes';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from '../editor/PatternCanvas';
import { PalettePanel } from '../editor/PalettePanel';
import { applyPencil, applyEraser, applyFill, cloneGrid } from '../editor/tools';
import { SaveNowButton } from '../persistence/SaveNowButton';
import { setLastOpenedPatternId } from '../settings/appSettings';
import {
  createInitialHistory,
  applyChange,
  undoHistory,
  redoHistory,
  type HistoryState,
} from '../editor/history';
import './PatternEditorPage.css';

export type PatternEditorProps = {
  patternId: string;
  /** When true, this pattern is remembered as "last opened" in app settings. */
  rememberAsLastOpened?: boolean;
  /** Optional custom title, e.g. part name instead of pattern name. */
  titleOverride?: string;
  /** Optional custom rename handler (used by group editor to rename parts). */
  onRenameTitle?: (newTitle: string) => void;
  /** Optional callback used in group editor to jump back to the parts list / top. */
  onBackToParts?: () => void;
};

/**
 * Reusable pattern editor that edits a single BeadPattern by id.
 * Used both as the standalone /editor/:projectId page and inside the group editor.
 */
export function PatternEditor({
  patternId,
  rememberAsLastOpened = true,
  titleOverride,
  onRenameTitle,
  onBackToParts,
}: PatternEditorProps) {
  const store = useBeadStore();

  const pattern = store.patterns[patternId];
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

  // Effective title shown in the header
  const effectiveTitle = titleOverride ?? pattern?.name ?? 'Pattern';

  // 🔹 Are we embedded inside a group editor?
  const isEmbeddedInGroup = !!onRenameTitle || !rememberAsLastOpened;

  // Remember this as last opened pattern when requested
  useEffect(() => {
    if (rememberAsLastOpened && patternId) {
      setLastOpenedPatternId(patternId);
    }
  }, [rememberAsLastOpened, patternId]);

  // Initialize history when pattern loads
  useEffect(() => {
    if (pattern && !history) {
      setHistory(createInitialHistory(cloneGrid(pattern.grid)));
    }
  }, [pattern, history]);

  // Keep selectedColorId in sync if palette changes (e.g. initial load)
  useEffect(() => {
    if (!palette) return;
    if (!editorState.selectedColorId && palette.colors.length > 0) {
      setEditorState((prev) => ({
        ...prev,
        selectedColorId: palette.colors[0].id,
      }));
    }
  }, [palette, editorState.selectedColorId]);

  if (!pattern || !shape || !palette) {
    return (
      <div>
        <h1>Pattern Editor</h1>
        <p>Pattern not found for id: {patternId}</p>
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

    store.updatePattern(pattern.id, { grid: cloneGrid(newGrid) });
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

  const handleRename = () => {
    const currentTitle = effectiveTitle;
    const next = window.prompt('Rename', currentTitle);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentTitle) return;

    if (onRenameTitle) {
      // Group editor case: rename the part
      onRenameTitle(trimmed);
    } else {
      // Standalone pattern editor: rename the pattern itself
      store.updatePattern(pattern.id, { name: trimmed });
    }
  };

  return (
    <div className="pattern-editor">
      <header className="pattern-editor__header">
        {isEmbeddedInGroup && onBackToParts && (
          <button
            type="button"
            className="pattern-editor__back-button"
            onClick={onBackToParts}
          >
            ↑ Parts
          </button>
        )}

        <div className="pattern-editor__title-row">
          <h1>{effectiveTitle}</h1>
          <button
            type="button"
            className="pattern-editor__rename-button"
            onClick={handleRename}
            title="Rename pattern"
            aria-label="Rename pattern"
          >
            ✏️
          </button>
        </div>

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
            <input
              type="checkbox"
              checked={editorState.gridVisible}
              onChange={handleGridToggle}
            />
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

        <div className="pattern-editor__save">
          <SaveNowButton />
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
              Tip: Choose a tool and color, then click the grid to draw. Undo/Redo lets you
              experiment freely.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Route wrapper for /editor/:projectId that just feeds the param into PatternEditor.
 */
export function PatternEditorPage() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <div>
        <h1>Pattern Editor</h1>
        <p>No project id provided.</p>
      </div>
    );
  }

  return <PatternEditor patternId={projectId} rememberAsLastOpened />;
}
// src/editor/PatternEditorSidebar.tsx
import type { EditorUiState } from '../domain/uiState';
import type { BeadPalette } from '../domain/colors';
import type { BeadGrid, CellRect } from './tools';
import { PalettePanel } from './PalettePanel';

export interface PatternEditorSidebarProps {
  palette: BeadPalette;

  shapeName: string;
  cols: number;
  rows: number;

  editorState: EditorUiState;
  canUndo: boolean;
  canRedo: boolean;

  onSelectTool: (tool: EditorUiState['selectedTool']) => void;
  onSelectColor: (colorId: string) => void;
  onUndo: () => void;
  onRedo: () => void;

  // Selection
  selectionRect: CellRect | null;
  clipboard: BeadGrid | null;
  onCopySelection: () => void;
  onCutSelection: () => void;
  onPasteSelection: () => void;
  onClearSelectionCells: () => void;
  onNudgeSelectionRight: () => void;

  // 👉 NEW: guide creation from selection (only used in group editor)
  onCreateHeightGuideFromSelection?: () => void;
  onCreateWidthGuideFromSelection?: () => void;

  // Mirroring
  onMirrorHorizontal: () => void;
  onMirrorVertical: () => void;

  // Replace color mode
  replaceFromColorId: string | null;
  onEnterReplaceMode: () => void;
}

export function PatternEditorSidebar({
  palette,
  shapeName,
  cols,
  rows,
  editorState,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectColor,
  onUndo,
  onRedo,
  selectionRect,
  clipboard,
  onCopySelection,
  onCutSelection,
  onPasteSelection,
  onClearSelectionCells,
  onNudgeSelectionRight,
  onCreateHeightGuideFromSelection,
  onCreateWidthGuideFromSelection,
  onMirrorHorizontal,
  onMirrorVertical,
  replaceFromColorId,
  onEnterReplaceMode,
}: PatternEditorSidebarProps) {
  const fromColor =
    replaceFromColorId != null
      ? palette.colors.find((c) => c.id === replaceFromColorId) ?? null
      : null;

  const toColor =
    editorState.selectedColorId != null
      ? palette.colors.find((c) => c.id === editorState.selectedColorId) ?? null
      : null;

  return (
    <aside className="pattern-editor__sidebar">
      {/* Palette first, no caption */}
      <PalettePanel
        palette={palette}
        selectedColorId={editorState.selectedColorId}
        onSelectColor={onSelectColor}
      />

      <div className="pattern-editor__tools">
        <div className="pattern-editor__tool-row">
          <button
            type="button"
            className={
              editorState.selectedTool === 'pencil'
                ? 'tool-button tool-button--active'
                : 'tool-button'
            }
            onClick={() => onSelectTool('pencil')}
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
            onClick={() => onSelectTool('eraser')}
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
            onClick={() => onSelectTool('fill')}
          >
            🪣 Fill
          </button>
          <button
            type="button"
            className={
              editorState.selectedTool === 'select'
                ? 'tool-button tool-button--active'
                : 'tool-button'
            }
            onClick={() => onSelectTool('select')}
          >
            ⬚ Select
          </button>

          {/* One-click symmetry actions */}
          <button
            type="button"
            className="tool-button"
            onClick={onMirrorHorizontal}
          >
            ↔ Mirror
          </button>
          <button
            type="button"
            className="tool-button"
            onClick={onMirrorVertical}
          >
            ↕ Mirror
          </button>

          {/* Global color replace: enter replace mode */}
          <button
            type="button"
            className="tool-button"
            disabled={!editorState.selectedColorId}
            onClick={onEnterReplaceMode}
          >
            🎯 Replace
          </button>
        </div>

        <div className="pattern-editor__tool-row">
          <button
            type="button"
            className="tool-button"
            disabled={!canUndo}
            onClick={onUndo}
          >
            ⬅️ Undo
          </button>
          <button
            type="button"
            className="tool-button"
            disabled={!canRedo}
            onClick={onRedo}
          >
            ➡️ Redo
          </button>
        </div>
      </div>

      {/* Selection tools – only show when there is a selection */}
      {selectionRect && (
        <div className="pattern-editor__section">
          <p>
            Selected: {selectionRect.width} × {selectionRect.height} cells
          </p>
          <div className="pattern-editor__tool-row">
            <button
              type="button"
              className="tool-button"
              onClick={onCopySelection}
            >
              📋 Copy
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={onCutSelection}
            >
              ✂️ Cut
            </button>
            <button
              type="button"
              className="tool-button"
              disabled={!clipboard}
              onClick={onPasteSelection}
            >
              📥 Paste
            </button>
          </div>
          <div className="pattern-editor__tool-row">
            <button
              type="button"
              className="tool-button"
              onClick={onClearSelectionCells}
            >
              🧹 Clear
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={onNudgeSelectionRight}
            >
              ➡️ Nudge →
            </button>
          </div>
          {/* NEW: guide creation – only when callbacks are provided (group editor) */}
          {(onCreateHeightGuideFromSelection || onCreateWidthGuideFromSelection) && (
            <div className="pattern-editor__tool-row">
              {onCreateHeightGuideFromSelection && (
                <button
                  type="button"
                  className="tool-button"
                  onClick={onCreateHeightGuideFromSelection}
                >
                  📏 Height guide
                </button>
              )}
              {onCreateWidthGuideFromSelection && (
                <button
                  type="button"
                  className="tool-button"
                  onClick={onCreateWidthGuideFromSelection}
                >
                  📐 Width guide
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Global color operations – only visible while replace mode is active */}
      {replaceFromColorId && (
        <div className="pattern-editor__section">
          <div className="pattern-editor__color-row">
            <div className="pattern-editor__color-indicator">
              <span className="pattern-editor__color-label">From</span>
              {fromColor ? (
                <span
                  className="pattern-editor__color-dot"
                  title={fromColor.name}
                  style={{
                    backgroundColor: `rgb(${fromColor.rgb.r}, ${fromColor.rgb.g}, ${fromColor.rgb.b})`,
                  }}
                />
              ) : (
                <span className="pattern-editor__color-placeholder">—</span>
              )}
            </div>

            <div className="pattern-editor__color-indicator">
              <span className="pattern-editor__color-label">To</span>
              {toColor ? (
                <span
                  className="pattern-editor__color-dot"
                  title={toColor.name}
                  style={{
                    backgroundColor: `rgb(${toColor.rgb.r}, ${toColor.rgb.g}, ${toColor.rgb.b})`,
                  }}
                />
              ) : (
                <span className="pattern-editor__color-placeholder">—</span>
              )}
            </div>
          </div>

          <p className="pattern-editor__hint">
            After pressing <strong>Replace</strong>, click a different color in the
            palette to replace all beads of the “From” color. The panel closes
            automatically after the replacement.
          </p>
        </div>
      )}

      <div className="pattern-editor__details">
        <h2>Details</h2>
        <p>Shape: {shapeName}</p>
        <p>
          Size: {cols} × {rows}
        </p>
        <p>Palette: {palette.name}</p>
        <p className="pattern-editor__hint">
          Tip: Choose a tool and color, then click the grid to draw. Use Select to
          move or copy areas. Undo/Redo lets you experiment freely.
        </p>
      </div>
    </aside>
  );
}
// src/editor/PatternEditor.tsx
import React, { useEffect, useState } from 'react';
import { useBeadStore } from '../store/beadStore';
import { isCellInShape } from '../domain/shapes';
import type { DimensionGuide } from '../domain/patterns';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from './PatternCanvas';
import {
  applyPencil,
  applyEraser,
  applyFill,
  replaceColor,
  mirrorGridHorizontally,
  mirrorGridVertically,
} from './tools';
import { setLastOpenedPatternId } from '../settings/appSettings';
import { usePatternHistory } from './usePatternHistory';
import { useSelectionTools } from './useSelectionTools';
import { PatternEditorHeader } from './PatternEditorHeader';
import { PatternEditorSidebar } from './PatternEditorSidebar';
import '../routes/PatternEditorPage.css';

function createGuideId(): string {
  return `guide_${Math.random().toString(36).slice(2, 10)}`;
}

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
  /** If provided, pattern is being edited as part of this group (for guides). */
  groupIdForGuides?: string;
  /** Optional group-level dimension guides (for group editing). */
  dimensionGuides?: DimensionGuide[];
  /** Allow caller to hide guides even if provided. */
  showGuidesOnCanvas?: boolean;
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
  groupIdForGuides,
  dimensionGuides,
  showGuidesOnCanvas = true,
}: PatternEditorProps) {
  const store = useBeadStore();

  const pattern = store.patterns[patternId] ?? null;
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

  // Global color replace state
  const [replaceFromColorId, setReplaceFromColorId] = useState<string | null>(null);

  // History & grid management (per pattern)
  const {
    getCurrentGrid,
    applyHistoryChange,
    canUndo,
    canRedo,
    undo,
    redo,
  } = usePatternHistory(pattern, pattern ? pattern.id : null);

  // Selection & clipboard tools
  const {
    selectionRect,
    selectionAnchor,
    clipboard,
    beginSelection,
    updateSelection,
    clearSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    clearSelectionCells,
    nudgeSelectionRight,
    setClipboard,
  } = useSelectionTools(getCurrentGrid, applyHistoryChange);

  // ─────────────────────────────────────────────────────────────
  // Dimension guides: create from current selection (group editor)
  // ─────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────
  // Dimension guides: create from current selection (group editor)
  // ─────────────────────────────────────────────────────────────

  const handleCreateHeightGuideFromSelection = () => {
    if (!groupIdForGuides) return;
    if (!selectionRect || !pattern) return;

    const rows = pattern.rows;

    // Selection covers rows [y, y + height - 1]
    // Top edge line index:
    const topLine = selectionRect.y; // 0..rows
    // Bottom edge line index (after the last row in the selection):
    const bottomLine = selectionRect.y + selectionRect.height; // 0..rows

    const topGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Top',
      axis: 'horizontal',
      reference: 'top',
      // line index from top
      cells: topLine,
    };

    const bottomGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Bottom',
      axis: 'horizontal',
      reference: 'bottom',
      // line index from bottom: rows - bottomLine
      cells: rows - bottomLine,
    };

    const { addDimensionGuide } = store;
    addDimensionGuide(groupIdForGuides, topGuide);
    addDimensionGuide(groupIdForGuides, bottomGuide);
  };

  const handleCreateWidthGuideFromSelection = () => {
    if (!groupIdForGuides) return;
    if (!selectionRect || !pattern) return;

    const cols = pattern.cols;

    // Selection covers cols [x, x + width - 1]
    const leftLine = selectionRect.x; // left edge line index: 0..cols
    const rightLine = selectionRect.x + selectionRect.width; // right edge line index: 0..cols

    const leftGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Left',
      axis: 'vertical',
      reference: 'left',
      // line index from left
      cells: leftLine,
    };

    const rightGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Right',
      axis: 'vertical',
      reference: 'right',
      // line index from right: cols - rightLine
      cells: cols - rightLine,
    };

    const { addDimensionGuide } = store;
    addDimensionGuide(groupIdForGuides, leftGuide);
    addDimensionGuide(groupIdForGuides, rightGuide);
  };

  // Effective title shown in the header
  const effectiveTitle = titleOverride ?? pattern?.name ?? 'Pattern';

  // Are we embedded inside a group editor?
  const isEmbeddedInGroup = !!onRenameTitle || !rememberAsLastOpened;

  // Remember this as last opened pattern when requested
  useEffect(() => {
    if (rememberAsLastOpened && patternId) {
      setLastOpenedPatternId(patternId);
    }
  }, [rememberAsLastOpened, patternId]);

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

  // When switching to another pattern (e.g. another group part), clear selection,
  // clipboard and replace-mode so each pattern starts with a clean editor state.
  useEffect(() => {
    clearSelection();
    setClipboard(null);
    setReplaceFromColorId(null);
  }, [patternId, clearSelection, setClipboard]);

  if (!pattern || !shape || !palette) {
    return (
      <div className="pattern-editor">
        <PatternEditorHeader
          title="Pattern Editor"
          isEmbeddedInGroup={false}
          zoom={1}
          gridVisible={true}
          outlinesVisible={true}
          onZoomChange={() => {}}
          onGridToggle={() => {}}
          onOutlinesToggle={() => {}}
          onRename={() => {}}
        />
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

    // If we leave the Select tool, clear the current selection.
    if (tool !== 'select') {
      clearSelection();
    }

    // Leaving the current drawing context: cancel replace mode as well.
    setReplaceFromColorId(null);
  };

  const handleSelectColor = (colorId: string) => {
    setEditorState((prev) => ({ ...prev, selectedColorId: colorId }));

    // If a "from" color is set and we pick a different "to" color,
    // automatically replace all occurrences in the pattern, then exit replace mode.
    if (replaceFromColorId && replaceFromColorId !== colorId) {
      const fromId = replaceFromColorId;
      applyHistoryChange((g) => replaceColor(g, fromId, colorId));
      setReplaceFromColorId(null);
    }
  };

  /**
   * Basic tools: pencil / eraser / fill
   * (still the same behavior, but we now call through applyHistoryChange).
   */
  const applyToolAtCell = (x: number, y: number) => {
    if (!isCellInShape(shape, x, y)) {
      return;
    }

    const currentGrid = getCurrentGrid();
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
      // Other tools handled elsewhere (e.g. 'select')
      return;
    }

    if (newGrid === currentGrid) {
      // No change (e.g. fill into same color)
      return;
    }

    applyHistoryChange(() => newGrid);
  };

  const handleCellPointerDown = (x: number, y: number) => {
    if (!isCellInShape(shape, x, y)) return;

    if (editorState.selectedTool === 'select') {
      // Start a new selection on each pointer down
      beginSelection(x, y);
      return;
    }

    // Other tools: apply once at pointer down
    applyToolAtCell(x, y);
  };

  const handleCellPointerMove = (x: number, y: number) => {
    if (!isCellInShape(shape, x, y)) return;

    if (editorState.selectedTool === 'select') {
      if (!selectionAnchor) return;
      updateSelection(x, y);
      return;
    }

    // For drawing tools, support drag: pencil/eraser continuous, fill only on down.
    if (editorState.selectedTool === 'pencil' || editorState.selectedTool === 'eraser') {
      applyToolAtCell(x, y);
    }
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

  // Global color operations
  const handlePickFromColor = () => {
    if (!editorState.selectedColorId) return;
    setReplaceFromColorId(editorState.selectedColorId);
  };

  // Mirroring
  const handleMirrorHorizontal = () => {
    applyHistoryChange((g) => mirrorGridHorizontally(g));
  };

  const handleMirrorVertical = () => {
    applyHistoryChange((g) => mirrorGridVertically(g));
  };

  return (
    <div className="pattern-editor">
      <PatternEditorHeader
        title={effectiveTitle}
        isEmbeddedInGroup={isEmbeddedInGroup}
        onBackToParts={onBackToParts}
        zoom={editorState.zoom}
        gridVisible={editorState.gridVisible}
        outlinesVisible={editorState.outlinesVisible}
        onZoomChange={handleZoomChange}
        onGridToggle={handleGridToggle}
        onOutlinesToggle={handleOutlinesToggle}
        onRename={handleRename}
      />

      <div className="pattern-editor__body">
        <div className="pattern-editor__canvas">
          <PatternCanvas
            pattern={pattern}
            shape={shape}
            palette={palette}
            editorState={editorState}
            onCellPointerDown={handleCellPointerDown}
            onCellPointerMove={handleCellPointerMove}
            selectionRect={selectionRect}
            groupGuides={showGuidesOnCanvas ? dimensionGuides : undefined}
            showGuides={showGuidesOnCanvas}
          />
        </div>

        <PatternEditorSidebar
          palette={palette}
          shapeName={shape.name}
          cols={pattern.cols}
          rows={pattern.rows}
          editorState={editorState}
          canUndo={canUndo}
          canRedo={canRedo}
          onSelectTool={handleSelectTool}
          onSelectColor={handleSelectColor}
          onUndo={undo}
          onRedo={redo}
          selectionRect={selectionRect}
          clipboard={clipboard}
          onCopySelection={copySelection}
          onCutSelection={cutSelection}
          onPasteSelection={pasteSelection}
          onClearSelectionCells={clearSelectionCells}
          onNudgeSelectionRight={nudgeSelectionRight}
          onCreateHeightGuideFromSelection={
            groupIdForGuides ? handleCreateHeightGuideFromSelection : undefined
          }
          onCreateWidthGuideFromSelection={
            groupIdForGuides ? handleCreateWidthGuideFromSelection : undefined
          }
          onMirrorHorizontal={handleMirrorHorizontal}
          onMirrorVertical={handleMirrorVertical}
          replaceFromColorId={replaceFromColorId}
          onEnterReplaceMode={handlePickFromColor}
        />
      </div>
    </div>
  );
}
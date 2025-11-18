// src/editor/PatternEditor.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useBeadStore } from '../store/beadStore';
import { isCellInShape } from '../domain/shapes';
import type { DimensionGuide } from '../domain/patterns';
import type { EditorUiState } from '../domain/uiState';
import type { BeadColor, BeadColorId } from '../domain/colors';
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
import { PatternPaletteDialog } from './PatternPaletteDialog';
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
  const palettes = store.palettes;

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

  // Palette dialog open/close
  const [isPaletteDialogOpen, setPaletteDialogOpen] = useState(false);

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
  } = useSelectionTools(getCurrentGrid, applyHistoryChange);

  // ─────────────────────────────────────────────────────────────
  // Active colors for this pattern (per-pattern palette)
  // ─────────────────────────────────────────────────────────────

  const colorsById = useMemo(() => {
    const map = new Map<BeadColorId, BeadColor>();
    Object.values(palettes).forEach((p) => {
      p.colors.forEach((c) => map.set(c.id, c));
    });
    return map;
  }, [palettes]);

  const activeColorIds: BeadColorId[] = useMemo(() => {
    if (!pattern) return [];
  
    // If there is NO activeColorIds field yet, this pattern is still using
    // the default palette → show all colors from the pattern's palette.
    if (pattern.activeColorIds === undefined) {
      if (!palette) return [];
      return palette.colors.map((c) => c.id);
    }
  
    // If activeColorIds exists (even if it's []), respect it as the truth.
    return pattern.activeColorIds;
  }, [pattern, palette]);

  const activeColors: BeadColor[] = useMemo(
    () =>
      activeColorIds
        .map((id) => colorsById.get(id))
        .filter((c): c is BeadColor => !!c),
    [activeColorIds, colorsById],
  );

  // ─────────────────────────────────────────────────────────────
  // Dimension guides: create from current selection (group editor)
  // ─────────────────────────────────────────────────────────────

  const handleCreateHeightGuideFromSelection = () => {
    if (!groupIdForGuides) return;
    if (!selectionRect || !pattern) return;

    const rows = pattern.rows;

    // Selection covers rows [y, y + height - 1]
    const topLine = selectionRect.y; // 0..rows
    const bottomLine = selectionRect.y + selectionRect.height; // 0..rows

    const topGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Top',
      axis: 'horizontal',
      reference: 'top',
      cells: topLine,
    };

    const bottomGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Bottom',
      axis: 'horizontal',
      reference: 'bottom',
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

    const leftLine = selectionRect.x;
    const rightLine = selectionRect.x + selectionRect.width;

    const leftGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Left',
      axis: 'vertical',
      reference: 'left',
      cells: leftLine,
    };

    const rightGuide: DimensionGuide = {
      id: createGuideId(),
      label: 'Right',
      axis: 'vertical',
      reference: 'right',
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

  // Keep selectedColorId in sync when active colors change
  useEffect(() => {
    if (activeColors.length === 0) {
      setEditorState((prev) => ({
        ...prev,
        selectedColorId: null,
      }));
      return;
    }
  
    if (
      !editorState.selectedColorId ||
      !activeColors.some((c) => c.id === editorState.selectedColorId)
    ) {
      const firstId = activeColors[0].id;
      setEditorState((prev) => ({
        ...prev,
        selectedColorId: firstId,
      }));
    }
  }, [activeColors, editorState.selectedColorId]);

  // When switching to another pattern, clear selection & replace mode
  useEffect(() => {
    clearSelection();
    setReplaceFromColorId(null);
    // keep palette dialog closed when switching patterns
    setPaletteDialogOpen(false);
  }, [patternId, clearSelection]);

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

    if (tool !== 'select') {
      clearSelection();
    }

    setReplaceFromColorId(null);
  };

  const handleSelectColor = (colorId: string) => {
    setEditorState((prev) => ({ ...prev, selectedColorId: colorId }));

    if (replaceFromColorId && replaceFromColorId !== colorId) {
      const fromId = replaceFromColorId;
      applyHistoryChange((g) => replaceColor(g, fromId, colorId));
      setReplaceFromColorId(null);
    }
  };

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
      return;
    }

    if (newGrid === currentGrid) {
      return;
    }

    applyHistoryChange(() => newGrid);
  };

  const handleCellPointerDown = (x: number, y: number) => {
    if (!isCellInShape(shape, x, y)) return;

    if (editorState.selectedTool === 'select') {
      beginSelection(x, y);
      return;
    }

    applyToolAtCell(x, y);
  };

  const handleCellPointerMove = (x: number, y: number) => {
    if (!isCellInShape(shape, x, y)) return;

    if (editorState.selectedTool === 'select') {
      if (!selectionAnchor) return;
      updateSelection(x, y);
      return;
    }

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
      onRenameTitle(trimmed);
    } else {
      store.updatePattern(pattern.id, { name: trimmed });
    }
  };

  const handlePickFromColor = () => {
    if (!editorState.selectedColorId) return;
    setReplaceFromColorId(editorState.selectedColorId);
  };

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
            colorsById={colorsById} 
          />
        </div>

        <PatternEditorSidebar
          palette={palette}
          activeColors={activeColors}
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
          onOpenPaletteDialog={() => setPaletteDialogOpen(true)}
        />
      </div>

      {isPaletteDialogOpen && (
        <PatternPaletteDialog
          pattern={pattern}
          palettes={palettes}
          activeColors={activeColors}
          onClose={() => setPaletteDialogOpen(false)}
        />
      )}
    </div>
  );
}
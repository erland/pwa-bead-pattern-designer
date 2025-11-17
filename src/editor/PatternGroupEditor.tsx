// src/editor/PatternGroupEditor.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBeadStore } from '../store/beadStore';
import type { BeadPattern, PatternGroup, DimensionGuide } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';
import { PatternEditor } from './PatternEditor';
import { GroupPartsSidebar } from './GroupPartsSidebar';
import { NewPatternPartDialog } from './NewPatternPartDialog';
import '../routes/PatternGroupEditorPage.css';

export interface PatternGroupEditorProps {
  groupId: string;
}

export function PatternGroupEditor({ groupId }: PatternGroupEditorProps) {
  const store = useBeadStore();

  const group: PatternGroup | undefined = store.groups[groupId];
  const patterns: Record<string, BeadPattern> = store.patterns;
  const shapes: Record<string, PegboardShape> = store.shapes;
  const palettes: Record<string, BeadPalette> = store.palettes;

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState('');
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);
  const [dialogShapeId, setDialogShapeId] = useState<string>('');
  const [dialogPaletteId, setDialogPaletteId] = useState<string>('');

  // Ref for the main editor area (used for auto-scroll on mobile)
  const mainEditorRef = useRef<HTMLDivElement | null>(null);

  const handleRemoveGuide = (guideId: string) => {
    if (!group) return;
    store.removeDimensionGuide(group.id, guideId);
  };

  // Keep selectedPartId valid when group changes
  useEffect(() => {
    if (!group) {
      setSelectedPartId(null);
      return;
    }

    if (group.parts.length === 0) {
      setSelectedPartId(null);
      return;
    }

    if (!selectedPartId || !group.parts.some((p) => p.id === selectedPartId)) {
      setSelectedPartId(group.parts[0].id);
    }
  }, [group, selectedPartId]);

  // Auto-scroll to the editor on mobile when a part is selected
  useEffect(() => {
    if (!selectedPartId) return;
    if (typeof window === 'undefined') return;

    // Only scroll when we're in the "stacked" layout (mobile/tablet)
    if (window.innerWidth > 900) return;

    if (!mainEditorRef.current) return;

    mainEditorRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [selectedPartId]);

  const selectedPart = useMemo(
    () => (group ? group.parts.find((p) => p.id === selectedPartId) ?? null : null),
    [group, selectedPartId],
  );

  const selectedPatternId = selectedPart?.patternId ?? null;

  // Group-level dimension guides (may be undefined)
  const dimensionGuides: DimensionGuide[] | undefined =
  group?.assemblyMetadata?.dimensionGuides;

  if (!group) {
    return (
      <div className="group-editor">
        <h1>Pattern Group Editor</h1>
        <p>Group not found for id: {groupId}</p>
      </div>
    );
  }

  const handleRenameGroup = () => {
    const nextName = window.prompt('Rename group', group.name);
    if (!nextName) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === group.name) return;
    store.updateGroup(group.id, { name: trimmed });
  };

  const handleToggleTemplate = (checked: boolean) => {
    // mark/unmark this group as a template
    store.markGroupAsTemplate(group.id, checked);
  };

  // ───────────────────────────────────────────────────────────────
  // New pattern-for-part dialog state & handlers
  // ───────────────────────────────────────────────────────────────

  const openNewPatternDialog = () => {
    const firstShape = Object.values(shapes)[0];
    const firstPalette = Object.values(palettes)[0];

    if (!firstShape || !firstPalette) {
      window.alert('Cannot create pattern: no shapes or palettes available.');
      return;
    }

    setDialogShapeId(firstShape.id);
    setDialogPaletteId(firstPalette.id);
    setIsNewPartDialogOpen(true);
  };

  const cancelNewPattern = () => {
    setIsNewPartDialogOpen(false);
  };

  const confirmNewPattern = () => {
    const shape = dialogShapeId ? shapes[dialogShapeId] : undefined;
    const palette = dialogPaletteId ? palettes[dialogPaletteId] : undefined;
    if (!shape || !palette) {
      return;
    }

    const patternName = newPartName.trim() || 'New Pattern';

    const patternId = store.createPattern({
      name: patternName,
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
      belongsToGroupId: group.id,
    });

    const partName = newPartName.trim() || patternName;

    const partId = store.addPartToGroup(group.id, {
      name: partName,
      patternId,
    });

    setIsNewPartDialogOpen(false);
    setNewPartName('');
    setSelectedPartId(partId);
  };

  // ───────────────────────────────────────────────────────────────
  // Part actions
  // ───────────────────────────────────────────────────────────────

  const handleRemovePart = (partId: string) => {
    store.removePartFromGroup(group.id, partId);
    if (selectedPartId === partId) {
      const nextGroup = useBeadStore.getState().groups[group.id];
      const nextFirst = nextGroup?.parts[0];
      setSelectedPartId(nextFirst ? nextFirst.id : null);
    }
  };

  const handleRenamePart = (partId: string) => {
    const part = group.parts.find((p) => p.id === partId);
    const currentName = part?.name ?? '';
    const nextName = window.prompt('Rename part', currentName);
    if (!nextName) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === currentName) return;
    store.renamePart(group.id, partId, trimmed);
  };

  const handleMovePart = (partId: string, direction: 'up' | 'down') => {
    const parts = group.parts;
    const index = parts.findIndex((p) => p.id === partId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parts.length) return;

    const order = parts.map((p) => p.id);
    const [removed] = order.splice(index, 1);
    order.splice(targetIndex, 0, removed);

    store.reorderParts(group.id, order);
  };

  // ───────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────

  return (
    <div className="group-editor">
      <header className="group-editor__header">
        <div className="group-editor__title-row">
          <h1 className="group-editor__title">{group.name}</h1>
          <button
            type="button"
            className="group-editor__icon-button group-editor__icon-button--title"
            title="Rename group"
            aria-label="Rename group"
            onClick={handleRenameGroup}
          >
            ✏️
          </button>
        </div>

        <div className="group-editor__template-row">
          <label className="group-editor__template-checkbox">
            <input
              type="checkbox"
              checked={!!group.isTemplate}
              onChange={(e) => handleToggleTemplate(e.target.checked)}
            />
            Use this group as a template
          </label>
        </div>
      </header>

      <div className="group-editor__body">
        <GroupPartsSidebar
          group={group}
          patterns={patterns}
          shapes={shapes}
          palettes={palettes}
          selectedPartId={selectedPartId}
          onSelectPart={setSelectedPartId}
          newPartName={newPartName}
          onChangeNewPartName={setNewPartName}
          onOpenNewPatternDialog={openNewPatternDialog}
          onRemovePart={handleRemovePart}
          onRenamePart={handleRenamePart}
          onMovePart={handleMovePart}
          dimensionGuides={dimensionGuides}
          onRemoveGuide={handleRemoveGuide}
        />

        <main ref={mainEditorRef} className="group-editor__main">
          {!selectedPart || !selectedPatternId ? (
            <div className="group-editor__empty-main">
              <p>Select a part in the list to start editing its pattern.</p>
            </div>
          ) : (
            <PatternEditor
              patternId={selectedPatternId}
              rememberAsLastOpened={false}
              titleOverride={selectedPart.name}
              onRenameTitle={(newTitle) => {
                // Rename the part in this group from inside the editor
                useBeadStore
                  .getState()
                  .renamePart(group.id, selectedPart.id, newTitle);
              }}
              onBackToParts={() => {
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                });
              }}
              groupIdForGuides={group.id}
              dimensionGuides={dimensionGuides}
              showGuidesOnCanvas
            />
          )}
        </main>

        <NewPatternPartDialog
          isOpen={isNewPartDialogOpen}
          partName={newPartName}                    // 🔹 add this
          onChangePartName={setNewPartName} 
          shapeId={dialogShapeId}
          paletteId={dialogPaletteId}
          shapes={shapes}
          palettes={palettes}
          onChangeShapeId={setDialogShapeId}
          onChangePaletteId={setDialogPaletteId}
          onCancel={cancelNewPattern}
          onConfirm={confirmNewPattern}
        />
      </div>
    </div>
  );
}
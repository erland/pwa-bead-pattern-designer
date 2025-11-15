import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from '../editor/PatternCanvas';
import { PatternEditor } from './PatternEditorPage';
import './PatternGroupEditorPage.css';

const THUMBNAIL_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: false,
  outlinesVisible: false,
};

export function PatternGroupEditorPage() {
  const { groupId } = useParams();
  const store = useBeadStore();

  const group = groupId ? store.groups[groupId] : undefined;

  const patterns = store.patterns;
  const shapes = store.shapes;
  const palettes = store.palettes;

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState('');

  // New pattern-for-part dialog state (mirrors HomePage)
  const [isNewPartPatternDialogOpen, setIsNewPartPatternDialogOpen] = useState(false);
  const [dialogShapeId, setDialogShapeId] = useState<string>('');
  const [dialogPaletteId, setDialogPaletteId] = useState<string>('');

  // Ref for the main editor area (used for auto-scroll on mobile)
  const mainEditorRef = useRef<HTMLDivElement | null>(null);

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

  if (!groupId) {
    return (
      <div className="group-editor">
        <h1>Pattern Group Editor</h1>
        <p>No group id provided.</p>
      </div>
    );
  }

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

  // Open dialog to create a new pattern for this part (shape + palette)
  const handleOpenNewPatternPartDialog = () => {
    const firstShape = Object.values(shapes)[0];
    const firstPalette = Object.values(palettes)[0];

    if (!firstShape || !firstPalette) {
      window.alert('Cannot create pattern: no shapes or palettes available.');
      return;
    }

    setDialogShapeId(firstShape.id);
    setDialogPaletteId(firstPalette.id);
    setIsNewPartPatternDialogOpen(true);
  };

  const handleCancelNewPatternPart = () => {
    setIsNewPartPatternDialogOpen(false);
  };

  const handleConfirmNewPatternPart = () => {
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
      // mark this pattern as owned by this group
      belongsToGroupId: group.id,
    });

    const partName = newPartName.trim() || patternName;

    const partId = store.addPartToGroup(group.id, {
      name: partName,
      patternId,
    });

    setIsNewPartPatternDialogOpen(false);
    setSelectedPartId(partId);
  };

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

  return (
    <div className="group-editor">
      <header className="group-editor__header">
        <div>
          <h1>{group.name}</h1>
          <p className="group-editor__subtitle">
            {group.parts.length === 0
              ? 'No parts yet'
              : `${group.parts.length} part${group.parts.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="group-editor__header-actions">
          <button type="button" className="group-editor__button" onClick={handleRenameGroup}>
            Rename group
          </button>
        </div>
      </header>

      <div className="group-editor__body">
        <aside className="group-editor__sidebar">
          <section>
            <h2 className="group-editor__section-title">Parts</h2>
            {group.parts.length === 0 ? (
              <p className="group-editor__empty">This group has no parts yet.</p>
            ) : (
              <ul className="group-editor__parts-list">
                {group.parts.map((part) => {
                  const pattern = patterns[part.patternId];
                  const shape = pattern ? shapes[pattern.shapeId] : undefined;
                  const palette = pattern ? palettes[pattern.paletteId] : undefined;
                  const isSelected = part.id === selectedPartId;

                  return (
                    <li
                      key={part.id}
                      className={
                        isSelected
                          ? 'group-editor__part-item group-editor__part-item--selected'
                          : 'group-editor__part-item'
                      }
                      onClick={() => setSelectedPartId(part.id)}
                    >
                      <div className="group-editor__part-main">
                        <span className="group-editor__part-main-text">
                          {part.name}{' '}
                          {pattern && (
                            <span className="group-editor__part-meta">
                              ({pattern.cols}×{pattern.rows})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="group-editor__part-actions">
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Move up"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPartId(part.id);
                            handleMovePart(part.id, 'up');
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Move down"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPartId(part.id);
                            handleMovePart(part.id, 'down');
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Rename part"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPartId(part.id);
                            handleRenamePart(part.id);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button group-editor__icon-button--danger"
                          title="Remove part"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemovePart(part.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {pattern && shape && palette && (
                        <div className="group-editor__thumbnail">
                          <PatternCanvas
                            pattern={pattern}
                            shape={shape}
                            palette={palette}
                            editorState={THUMBNAIL_EDITOR_STATE}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="group-editor__add-part">
            <h2 className="group-editor__section-title">Add Part</h2>

            <label className="group-editor__field">
              <span className="group-editor__field-label">Part name</span>
              <input
                type="text"
                value={newPartName}
                onChange={(event) => setNewPartName(event.target.value)}
                placeholder="e.g. Front, Left wing"
              />
            </label>

            <button
              type="button"
              className="group-editor__button group-editor__button--primary"
              onClick={handleOpenNewPatternPartDialog}
            >
              Create new pattern &amp; add
            </button>
          </section>
        </aside>

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
                useBeadStore.getState().renamePart(group.id, selectedPart.id, newTitle);
              }}
              onBackToParts={() => {
                // Scroll the *whole page* to the top so the app header + Projects menu are visible
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                });
              }}
            />
          )}
        </main>

        {isNewPartPatternDialogOpen && (
          <div className="new-pattern-dialog-backdrop">
            <div className="new-pattern-dialog">
              <h2>Create New Pattern for Part</h2>
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
                <button type="button" onClick={handleCancelNewPatternPart}>
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmNewPatternPart}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
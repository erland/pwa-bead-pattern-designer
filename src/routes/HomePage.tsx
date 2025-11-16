import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBeadStore,
} from '../store/beadStore';
import { getLastOpenedPatternId, setLastOpenedPatternId } from '../settings/appSettings';
import { PatternCanvas } from '../editor/PatternCanvas';
import type { EditorUiState } from '../domain/uiState';
import './HomePage.css';

const HOME_THUMBNAIL_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: false,
  outlinesVisible: false,
};

export function HomePage() {
  const navigate = useNavigate();

  // Store selectors with stable references
  const patternsMap = useBeadStore((state) => state.patterns);
  const groupsMap = useBeadStore((state) => state.groups);
  const shapes = useBeadStore((state) => state.shapes);
  const palettes = useBeadStore((state) => state.palettes);
  const createPattern = useBeadStore((state) => state.createPattern);
  const createGroup = useBeadStore((state) => state.createGroup);
  const deletePattern = useBeadStore((state) => state.deletePattern);
  const deleteGroup = useBeadStore((state) => state.deleteGroup);

  const createGroupFromTemplateGroup = useBeadStore(
    (state) => state.createGroupFromTemplateGroup,
  );

  const templateGroups = Object.values(groupsMap).filter(
    (g) => g.isTemplate,
  );

  // Derived arrays
  const groups = Object.values(groupsMap);
  // Only show patterns that are not embedded in a group
  const topLevelPatterns = Object.values(patternsMap).filter(
    (p) => !p.belongsToGroupId
  );

  // Combined project cards: patterns + groups
  const projectCards = [
    ...topLevelPatterns.map((pattern) => ({
      type: 'pattern' as const,
      pattern,
    })),
    ...groups.map((group) => ({
      type: 'group' as const,
      group,
    })),
  ];

  // "Last opened" pattern from settings + current store
  const lastOpenedId = getLastOpenedPatternId();
  const lastOpenedPattern = lastOpenedId ? patternsMap[lastOpenedId] : undefined;

  // --- New Pattern dialog state ---
  const [isNewPatternDialogOpen, setIsNewPatternDialogOpen] = useState(false);
  const [dialogShapeId, setDialogShapeId] = useState<string>('');
  const [dialogPaletteId, setDialogPaletteId] = useState<string>('');

  // --- Template picker dialog state ---
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplateGroupId, setSelectedTemplateGroupId] = useState<string | null>(null);

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

  // Open a pattern and remember it as "last opened"
  const openPattern = (id: string) => {
    setLastOpenedPatternId(id);
    navigate(`/editor/${id}`);
  };

  const handleConfirmNewPattern = () => {
    const shape = dialogShapeId ? shapes[dialogShapeId] : undefined;
    const palette = dialogPaletteId ? palettes[dialogPaletteId] : undefined;
    if (!shape || !palette) {
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
    openPattern(id);
  };

  const handleNewGroup = () => {
    const id = createGroup('New Pattern Group');
    navigate(`/group/${id}`);
  };

  const handleOpenTemplateDialog = () => {
    const firstTemplate = templateGroups[0];
    setSelectedTemplateGroupId((current) => current ?? firstTemplate?.id ?? null);
    setIsTemplateDialogOpen(true);
  };

  const handleCancelTemplateDialog = () => {
    setIsTemplateDialogOpen(false);
  };

  const handleConfirmTemplateDialog = () => {
    if (!selectedTemplateGroupId) return;
    const newGroupId = createGroupFromTemplateGroup(selectedTemplateGroupId);
    setIsTemplateDialogOpen(false);
    navigate(`/group/${newGroupId}`);
  };

  // Delete a pattern (top-level only)
  const handleDeletePattern = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete pattern "${name}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    // If this was the "last opened" pattern, clear it
    if (lastOpenedId === id) {
      setLastOpenedPatternId(null);
    }

    deletePattern(id);
  };

  // Delete a pattern group
  const handleDeleteGroup = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete pattern group "${name}"?\n\nThis will also delete any patterns that belong only to this group.`
    );
    if (!confirmed) return;

    deleteGroup(id);
  };

  // Open print / export view for a single pattern
  const handleOpenPrintPattern = (id: string) => {
    navigate(`/print/${id}`);
  };

  // Open print / export view for a pattern group
  const handleOpenPrintGroup = (id: string) => {
    navigate(`/print-group/${id}`);
  };

  return (
    <div className="home-page">
      <header className="home-header-row">
        <div className="home-actions">
          <button type="button" onClick={handleOpenNewPatternDialog}>
            New Pattern
          </button>
          <button type="button" onClick={handleNewGroup}>
            New Pattern Group
          </button>
          <button type="button" onClick={handleOpenTemplateDialog}>
            New from Template
          </button>
        </div>
      </header>

      <section className="home-section">
        {/* "Open last" still refers to last opened *pattern* */}
        {lastOpenedPattern && (
          <div className="home-last-opened">
            <button
              type="button"
              className="home-last-opened__button"
              onClick={() => openPattern(lastOpenedPattern.id)}
            >
              Open last: <strong>{lastOpenedPattern.name}</strong>
            </button>
          </div>
        )}

        {projectCards.length === 0 ? (
          <p>No patterns yet. Create a pattern or pattern group to get started.</p>
        ) : (
          <div className="pattern-grid">
            {projectCards.map((card) => {
              if (card.type === 'pattern') {
                const p = card.pattern;
                const shape = shapes[p.shapeId];
                const palette = palettes[p.paletteId];

                const handleOpen = () => openPattern(p.id);

                return (
                  <div key={`pattern-${p.id}`} className="pattern-grid__item">
                    <button
                      type="button"
                      className="pattern-card"
                      onClick={handleOpen}
                    >
                      {shape && palette && (
                        <div className="pattern-card__thumbnail">
                          <PatternCanvas
                            pattern={p}
                            shape={shape}
                            palette={palette}
                            editorState={HOME_THUMBNAIL_EDITOR_STATE}
                          />
                        </div>
                      )}
                      <div className="pattern-card__title">
                        {p.name}
                      </div>
                    </button>

                    <div className="pattern-card__actions">
                      <button
                        type="button"
                        className="home-list__item-secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenPrintPattern(p.id);
                        }}
                      >
                        Print / Export
                      </button>
                      <button
                        type="button"
                        className="home-list__item-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeletePattern(p.id, p.name);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }

              // Group card
              const g = card.group;
              const firstPart = g.parts[0];
              const pattern = firstPart ? patternsMap[firstPart.patternId] : undefined;
              const shape = pattern ? shapes[pattern.shapeId] : undefined;
              const palette = pattern ? palettes[pattern.paletteId] : undefined;

              const handleOpenGroup = () => navigate(`/group/${g.id}`);

              return (
                <div key={`group-${g.id}`} className="pattern-grid__item">
                  <button
                    type="button"
                    className="pattern-card"
                    onClick={handleOpenGroup}
                  >
                    {pattern && shape && palette && (
                      <div className="pattern-card__thumbnail">
                        <PatternCanvas
                          pattern={pattern}
                          shape={shape}
                          palette={palette}
                          editorState={HOME_THUMBNAIL_EDITOR_STATE}
                        />
                      </div>
                    )}
                    <div className="pattern-card__title">
                      {g.name}
                    </div>
                  </button>

                  <div className="pattern-card__actions">
                    <button
                      type="button"
                      className="home-list__item-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenPrintGroup(g.id);
                      }}
                    >
                      Print / Export
                    </button>
                    <button
                      type="button"
                      className="home-list__item-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteGroup(g.id, g.name);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
      {/* Template picker dialog */}
      {isTemplateDialogOpen && (
        <div className="new-pattern-dialog-backdrop">
          <div className="new-pattern-dialog">
            <h2>Create Group from Template</h2>

            {templateGroups.length === 0 ? (
              <p>No templates defined yet. Mark a group as template in the editor to use it here.</p>
            ) : (
              <>
                <div className="new-pattern-dialog__field">
                  <label>
                    Template:
                    <select
                      value={selectedTemplateGroupId ?? ''}
                      onChange={(e) =>
                        setSelectedTemplateGroupId(e.target.value || null)
                      }
                    >
                      {templateGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedTemplateGroupId && (
                  <div className="new-pattern-dialog__field home-template-dialog__description">
                    <p>
                      <strong>Parts:</strong>{' '}
                      {groupsMap[selectedTemplateGroupId]?.parts
                        .map((p) => p.name)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="new-pattern-dialog__actions">
              <button type="button" onClick={handleCancelTemplateDialog}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTemplateDialog}
                disabled={!selectedTemplateGroupId}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
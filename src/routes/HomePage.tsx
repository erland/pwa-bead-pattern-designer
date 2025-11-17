import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import {
  getLastOpenedPatternId,
  setLastOpenedPatternId,
} from '../settings/appSettings';
import { PatternCanvas } from '../editor/PatternCanvas';
import type { EditorUiState } from '../domain/uiState';
import { NewPatternDialog } from './NewPatternDialog';
import { TemplateGroupDialog } from './TemplateGroupDialog';
import { NewGroupDialog } from './NewGroupDialog';
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

  const patternsMap = useBeadStore((state) => state.patterns);
  const groupsMap = useBeadStore((state) => state.groups);
  const shapes = useBeadStore((state) => state.shapes);
  const palettes = useBeadStore((state) => state.palettes);
  const createPattern = useBeadStore((state) => state.createPattern);
  const createGroup = useBeadStore((state) => state.createGroup);
  const deletePattern = useBeadStore((state) => state.deletePattern);
  const deleteGroup = useBeadStore((state) => state.deleteGroup);
  const updateGroup = useBeadStore((state) => state.updateGroup);
  const createGroupFromTemplateGroup = useBeadStore(
    (state) => state.createGroupFromTemplateGroup,
  );

  const templateGroups = Object.values(groupsMap).filter((g) => g.isTemplate);

  const groups = Object.values(groupsMap);
  const topLevelPatterns = Object.values(patternsMap).filter(
    (p) => !p.belongsToGroupId,
  );

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

  const lastOpenedId = getLastOpenedPatternId();
  const lastOpenedPattern = lastOpenedId
    ? patternsMap[lastOpenedId]
    : undefined;

  // Dialog open/close state only
  const [isNewPatternDialogOpen, setIsNewPatternDialogOpen] = useState(false);
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const openPattern = (id: string) => {
    setLastOpenedPatternId(id);
    navigate(`/editor/${id}`);
  };

  const handleOpenNewPatternDialog = () => {
    setIsNewPatternDialogOpen(true);
  };

  const handleCancelNewPattern = () => {
    setIsNewPatternDialogOpen(false);
  };

  const handleCreatePatternFromDialog = (
    name: string,
    shapeId: string,
    paletteId: string,
  ) => {
    const shape = shapes[shapeId];
    const palette = palettes[paletteId];
    if (!shape || !palette) return;

    const id = createPattern({
      name,
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
    });

    setIsNewPatternDialogOpen(false);
    openPattern(id);
  };

  // ── New group dialog handlers ─────────────────────────────

  const handleOpenNewGroupDialog = () => {
    setIsNewGroupDialogOpen(true);
  };

  const handleCancelNewGroup = () => {
    setIsNewGroupDialogOpen(false);
  };

  const handleCreateGroupFromDialog = (name: string) => {
    const id = createGroup(name);
    setIsNewGroupDialogOpen(false);
    navigate(`/group/${id}`);
  };

  // ── Template dialog handlers ──────────────────────────────

  const handleOpenTemplateDialog = () => {
    setIsTemplateDialogOpen(true);
  };

  const handleCancelTemplateDialog = () => {
    setIsTemplateDialogOpen(false);
  };

  const handleCreateGroupFromTemplate = (
    name: string,
    templateGroupId: string,
  ) => {
    const newGroupId = createGroupFromTemplateGroup(templateGroupId);
    // Override the default name with the user-provided one
    updateGroup(newGroupId, { name });
    setIsTemplateDialogOpen(false);
    navigate(`/group/${newGroupId}`);
  };

  const handleDeletePattern = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete pattern "${name}"?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    if (lastOpenedId === id) {
      setLastOpenedPatternId(null);
    }

    deletePattern(id);
  };

  const handleDeleteGroup = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete pattern group "${name}"?\n\nThis will also delete any patterns that belong only to this group.`,
    );
    if (!confirmed) return;

    deleteGroup(id);
  };

  const handleOpenPrintPattern = (id: string) => {
    navigate(`/print/${id}`);
  };

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
          <button type="button" onClick={handleOpenNewGroupDialog}>
            New Pattern Group
          </button>
          <button type="button" onClick={handleOpenTemplateDialog}>
            New from Template
          </button>
        </div>
      </header>

      <section className="home-section">
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
                      <div className="pattern-card__title">{p.name}</div>
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

              const g = card.group;
              const firstPart = g.parts[0];
              const pattern = firstPart
                ? patternsMap[firstPart.patternId]
                : undefined;
              const shape = pattern ? shapes[pattern.shapeId] : undefined;
              const palette = pattern
                ? palettes[pattern.paletteId]
                : undefined;

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
                    <div className="pattern-card__title">{g.name}</div>
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

      <NewPatternDialog
        isOpen={isNewPatternDialogOpen}
        shapes={shapes}
        palettes={palettes}
        onCancel={handleCancelNewPattern}
        onCreate={handleCreatePatternFromDialog}
      />

      <NewGroupDialog
        isOpen={isNewGroupDialogOpen}
        onCancel={handleCancelNewGroup}
        onCreate={handleCreateGroupFromDialog}
      />

      <TemplateGroupDialog
        isOpen={isTemplateDialogOpen}
        templateGroups={templateGroups}
        groupsById={groupsMap}
        onCancel={handleCancelTemplateDialog}
        onCreateFromTemplate={handleCreateGroupFromTemplate}
      />
    </div>
  );
}
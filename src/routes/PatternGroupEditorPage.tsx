import React, { useEffect, useMemo, useState } from 'react';
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
  const [newPartPatternId, setNewPartPatternId] = useState<string>('');

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

  // Default pattern selection for "Add part" controls
  useEffect(() => {
    if (!newPartPatternId) {
      const firstPatternId = Object.keys(patterns)[0];
      if (firstPatternId) {
        setNewPartPatternId(firstPatternId);
        if (!newPartName) {
          setNewPartName(patterns[firstPatternId].name);
        }
      }
    }
  }, [patterns, newPartPatternId, newPartName]);

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

  const handleAddPart = () => {
    const pattern = newPartPatternId ? patterns[newPartPatternId] : undefined;
    if (!pattern) return;

    const name = newPartName.trim() || pattern.name;

    const partId = store.addPartToGroup(group.id, {
      name,
      patternId: pattern.id,
    });

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
                    >
                      <button
                        type="button"
                        className="group-editor__part-main"
                        onClick={() => setSelectedPartId(part.id)}
                      >
                        <span className="group-editor__part-main-text">
                          {part.name}{' '}
                          {pattern && (
                            <span className="group-editor__part-meta">
                              ({pattern.cols}×{pattern.rows})
                            </span>
                          )}
                        </span>
                      </button>

                      <div className="group-editor__part-actions">
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Move up"
                          onClick={() => handleMovePart(part.id, 'up')}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Move down"
                          onClick={() => handleMovePart(part.id, 'down')}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button"
                          title="Rename part"
                          onClick={() => handleRenamePart(part.id)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="group-editor__icon-button group-editor__icon-button--danger"
                          title="Remove part"
                          onClick={() => handleRemovePart(part.id)}
                        >
                          ✕
                        </button>

                        {pattern && (
                          <span className="group-editor__pattern-name">
                            {pattern.name}
                          </span>
                        )}
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
            {Object.keys(patterns).length === 0 ? (
              <p className="group-editor__empty">
                You need at least one pattern before you can add parts.
              </p>
            ) : (
              <>
                <label className="group-editor__field">
                  <span className="group-editor__field-label">Pattern</span>
                  <select
                    value={newPartPatternId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setNewPartPatternId(id);
                      const p = patterns[id];
                      if (p && !newPartName) {
                        setNewPartName(p.name);
                      }
                    }}
                  >
                    {Object.values(patterns).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

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
                  onClick={handleAddPart}
                >
                  Add part
                </button>
              </>
            )}
          </section>
        </aside>

        <main className="group-editor__main">
          {!selectedPatternId ? (
            <div className="group-editor__empty-main">
              <p>Select a part in the list to start editing its pattern.</p>
            </div>
          ) : (
            <PatternEditor patternId={selectedPatternId} rememberAsLastOpened={false} />
          )}
        </main>
      </div>
    </div>
  );
}
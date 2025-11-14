import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import { getLastOpenedPatternId, setLastOpenedPatternId } from '../settings/appSettings';

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

  // Figure out "last opened" pattern from settings + current store
  const lastOpenedId = getLastOpenedPatternId();
  const lastOpenedPattern = lastOpenedId ? patternsMap[lastOpenedId] : undefined;

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

  // Central helper: open a pattern and remember it as "last opened"
  const openPattern = (id: string) => {
    setLastOpenedPatternId(id);
    navigate(`/editor/${id}`);
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
    openPattern(id);
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

        {/* Inline "Open last" inside the Patterns group */}
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

        {patterns.length === 0 ? (
          <p>No patterns yet. Create one to get started.</p>
        ) : (
          <ul className="home-list">
            {patterns.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => openPattern(p.id)}>
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
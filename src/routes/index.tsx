// src/routes/index.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';

export function HomePage() {
  const navigate = useNavigate();

  // 👇 selectors now return stable references (no Object.values inside)
  const patternsMap = useBeadStore((state) => state.patterns);
  const groupsMap = useBeadStore((state) => state.groups);
  const shapes = useBeadStore((state) => state.shapes);
  const palettes = useBeadStore((state) => state.palettes);
  const createPattern = useBeadStore((state) => state.createPattern);
  const createGroup = useBeadStore((state) => state.createGroup);

  // 👇 derive arrays outside the selector
  const patterns = Object.values(patternsMap);
  const groups = Object.values(groupsMap);

  const handleNewPattern = () => {
    const shape = Object.values(shapes)[0];
    const palette = Object.values(palettes)[0];
    if (!shape || !palette) return;

    const id = createPattern({
      name: 'New Pattern',
      shapeId: shape.id,
      cols: shape.cols,
      rows: shape.rows,
      paletteId: palette.id,
    });

    navigate(`/editor/${id}`);
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
          <button type="button" onClick={handleNewPattern}>
            New Pattern
          </button>
          <button type="button" onClick={handleNewGroup}>
            New Pattern Group
          </button>
        </div>
      </header>

      <section className="home-section">
        <h2>Patterns</h2>
        {patterns.length === 0 ? (
          <p>No patterns yet. Create one to get started.</p>
        ) : (
          <ul className="home-list">
            {patterns.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => navigate(`/editor/${p.id}`)}>
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
    </div>
  );
}

export function PatternEditorPage() {
  const { projectId } = useParams();
  return (
    <div>
      <h1>Pattern Editor</h1>
      <p>Editing project: {projectId}</p>
    </div>
  );
}

export function PatternGroupEditorPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Pattern Group Editor</h1>
      <p>Editing group: {groupId}</p>
    </div>
  );
}

export function ImageConvertPage() {
  return (
    <div>
      <h1>Image to Pattern</h1>
      <p>Placeholder for image upload & conversion.</p>
    </div>
  );
}

export function PatternPrintPage() {
  const { projectId } = useParams();
  return (
    <div>
      <h1>Print Pattern</h1>
      <p>Pattern ID: {projectId}</p>
    </div>
  );
}

export function PatternGroupPrintPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Print Pattern Group</h1>
      <p>Group ID: {groupId}</p>
    </div>
  );
}
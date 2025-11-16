// src/routes/PatternGroupEditorPage.tsx
import { useParams } from 'react-router-dom';
import { PatternGroupEditor } from '../editor/PatternGroupEditor';

export function PatternGroupEditorPage() {
  const { groupId } = useParams();

  if (!groupId) {
    return (
      <div className="group-editor">
        <h1>Pattern Group Editor</h1>
        <p>No group id provided.</p>
      </div>
    );
  }

  return <PatternGroupEditor groupId={groupId} />;
}
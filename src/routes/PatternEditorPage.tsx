// src/routes/PatternEditorPage.tsx
import { useParams } from 'react-router-dom';
import { PatternEditor } from '../editor/PatternEditor';

export function PatternEditorPage() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <div>
        <h1>Pattern Editor</h1>
        <p>No project id provided.</p>
      </div>
    );
  }

  return <PatternEditor patternId={projectId} rememberAsLastOpened />;
}
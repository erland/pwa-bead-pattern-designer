import { useParams } from 'react-router-dom';

export function PatternGroupEditorPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Pattern Group Editor</h1>
      <p>Editing group: {groupId}</p>
    </div>
  );
}
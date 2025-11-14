import { useParams } from 'react-router-dom';

export function HomePage() {
  return (
    <div>
      <h1>Projects</h1>
      <p>Placeholder for pattern and group list.</p>
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
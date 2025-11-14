import { useParams } from 'react-router-dom';

export function PatternPrintPage() {
  const { projectId } = useParams();
  return (
    <div>
      <h1>Print Pattern</h1>
      <p>Pattern ID: {projectId}</p>
    </div>
  );
}
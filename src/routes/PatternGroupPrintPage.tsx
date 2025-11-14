import { useParams } from 'react-router-dom';

export function PatternGroupPrintPage() {
  const { groupId } = useParams();
  return (
    <div>
      <h1>Print Pattern Group</h1>
      <p>Group ID: {groupId}</p>
    </div>
  );
}
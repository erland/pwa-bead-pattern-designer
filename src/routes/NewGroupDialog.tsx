// src/routes/NewGroupDialog.tsx
import { useEffect, useState } from 'react';

export interface NewGroupDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
}

export function NewGroupDialog({
  isOpen,
  onCancel,
  onCreate,
}: NewGroupDialogProps) {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalName = name.trim() || 'New Pattern Group';
    onCreate(finalName);
  };

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create New Pattern Group</h2>

        <div className="new-pattern-dialog__field">
          <label>
            Group name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spaceship, Dragon, House"
            />
          </label>
        </div>

        <div className="new-pattern-dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
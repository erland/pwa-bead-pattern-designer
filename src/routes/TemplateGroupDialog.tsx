// src/routes/TemplateGroupDialog.tsx
import { useEffect, useState } from 'react';
import type { PatternGroup } from '../domain/patterns';

export interface TemplateGroupDialogProps {
  isOpen: boolean;
  templateGroups: PatternGroup[];
  groupsById: Record<string, PatternGroup>;
  onCancel: () => void;
  onCreateFromTemplate: (name: string, templateGroupId: string) => void;
}

export function TemplateGroupDialog({
  isOpen,
  templateGroups,
  groupsById,
  onCancel,
  onCreateFromTemplate,
}: TemplateGroupDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState<string>('');

  // When dialog opens, pick first template and default name from it
  useEffect(() => {
    if (!isOpen) return;

    if (templateGroups.length === 0) {
      setSelectedTemplateId(null);
      setName('');
      return;
    }

    const first = templateGroups[0];
    setSelectedTemplateId(first.id);
  }, [isOpen, templateGroups]);

  if (!isOpen) {
    return null;
  }

  const selectedTemplate =
    selectedTemplateId != null ? groupsById[selectedTemplateId] : undefined;

  const handleTemplateChange = (value: string) => {
    const id = value || null;
    setSelectedTemplateId(id);

    if (id) {
      const template = groupsById[id];
      // Default name to the selected template's name
      setName(template?.name ?? '');
    } else {
      setName('');
    }
  };

  const handleConfirm = () => {
    if (!selectedTemplateId) return;

    const fallbackName =
      selectedTemplate?.name ?? 'New Pattern Group from Template';
    const finalName = name.trim() || fallbackName;

    onCreateFromTemplate(finalName, selectedTemplateId);
  };

  const hasTemplates = templateGroups.length > 0;

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create Group from Template</h2>

        {!hasTemplates ? (
          <p>
            No templates defined yet. Mark a group as template in the editor to
            use it here.
          </p>
        ) : (
          <>
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

            <div className="new-pattern-dialog__field">
              <label>
                Template:
                <select
                  value={selectedTemplateId ?? ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  {templateGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedTemplate && (
              <div className="new-pattern-dialog__field home-template-dialog__description">
                <p>
                  <strong>Parts:</strong>{' '}
                  {selectedTemplate.parts.map((p) => p.name).join(', ')}
                </p>
              </div>
            )}
          </>
        )}

        <div className="new-pattern-dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasTemplates || !selectedTemplateId}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
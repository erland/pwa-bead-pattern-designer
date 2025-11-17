// src/routes/TemplateGroupDialog.tsx
import React, { useEffect, useState } from 'react';
import type { PatternGroup } from '../domain/patterns';

export interface TemplateGroupDialogProps {
  isOpen: boolean;
  templateGroups: PatternGroup[];
  groupsById: Record<string, PatternGroup>;
  onCancel: () => void;
  onCreateFromTemplate: (templateGroupId: string) => void;
}

export function TemplateGroupDialog({
  isOpen,
  templateGroups,
  groupsById,
  onCancel,
  onCreateFromTemplate,
}: TemplateGroupDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // When dialog opens, ensure we have some selection
  useEffect(() => {
    if (!isOpen) return;
    if (templateGroups.length === 0) {
      setSelectedTemplateId(null);
      return;
    }

    setSelectedTemplateId((current) => current ?? templateGroups[0]?.id ?? null);
  }, [isOpen, templateGroups]);

  if (!isOpen) {
    return null;
  }

  const selectedTemplate =
    selectedTemplateId != null ? groupsById[selectedTemplateId] : undefined;

  const handleConfirm = () => {
    if (!selectedTemplateId) return;
    onCreateFromTemplate(selectedTemplateId);
  };

  return (
    <div className="new-pattern-dialog-backdrop">
      <div className="new-pattern-dialog">
        <h2>Create Group from Template</h2>

        {templateGroups.length === 0 ? (
          <p>No templates defined yet. Mark a group as template in the editor to use it here.</p>
        ) : (
          <>
            <div className="new-pattern-dialog__field">
              <label>
                Template:
                <select
                  value={selectedTemplateId ?? ''}
                  onChange={(e) =>
                    setSelectedTemplateId(e.target.value || null)
                  }
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
            disabled={!selectedTemplateId}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
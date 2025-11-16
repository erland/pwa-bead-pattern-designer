// src/editor/PatternEditorHeader.tsx
import { type ChangeEventHandler } from 'react';
import { SaveNowButton } from '../persistence/SaveNowButton';

export interface PatternEditorHeaderProps {
  title: string;
  isEmbeddedInGroup: boolean;
  onBackToParts?: () => void;

  zoom: number;
  gridVisible: boolean;
  outlinesVisible: boolean;

  onZoomChange: ChangeEventHandler<HTMLInputElement>;
  onGridToggle: ChangeEventHandler<HTMLInputElement>;
  onOutlinesToggle: ChangeEventHandler<HTMLInputElement>;

  onRename: () => void;
}

export function PatternEditorHeader({
  title,
  isEmbeddedInGroup,
  onBackToParts,
  zoom,
  gridVisible,
  outlinesVisible,
  onZoomChange,
  onGridToggle,
  onOutlinesToggle,
  onRename,
}: PatternEditorHeaderProps) {
  return (
    <header className="pattern-editor__header">
      {isEmbeddedInGroup && onBackToParts && (
        <button
          type="button"
          className="pattern-editor__back-button"
          onClick={onBackToParts}
        >
          ↑ Parts
        </button>
      )}

      <div className="pattern-editor__title-row">
        <h1>{title}</h1>
        <button
          type="button"
          className="pattern-editor__rename-button"
          onClick={onRename}
          title="Rename pattern"
          aria-label="Rename pattern"
        >
          ✏️
        </button>
      </div>

      <div className="pattern-editor__controls">
        <label>
          Zoom
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={onZoomChange}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={onGridToggle}
          />
          Grid
        </label>
        <label>
          <input
            type="checkbox"
            checked={outlinesVisible}
            onChange={onOutlinesToggle}
          />
          Outlines
        </label>
      </div>

      <div className="pattern-editor__save">
        <SaveNowButton />
      </div>
    </header>
  );
}
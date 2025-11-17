// src/editor/GroupPartsSidebar.tsx
import type {
  BeadPattern,
  PatternGroup,
  PatternPart,
  DimensionGuide,
} from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import type { BeadPalette } from '../domain/colors';
import type { EditorUiState } from '../domain/uiState';
import { PatternCanvas } from './PatternCanvas';

const THUMBNAIL_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: false,
  outlinesVisible: false,
};

export interface GroupPartsSidebarProps {
  group: PatternGroup;
  patterns: Record<string, BeadPattern>;
  shapes: Record<string, PegboardShape>;
  palettes: Record<string, BeadPalette>;

  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;

  // no explicit form fields here anymore, just the trigger:
  onOpenNewPatternDialog: () => void;

  onRemovePart: (partId: string) => void;
  onRenamePart: (partId: string) => void;
  onMovePart: (partId: string, direction: 'up' | 'down') => void;

  dimensionGuides?: DimensionGuide[];
  onRemoveGuide?: (guideId: string) => void;
}

export function GroupPartsSidebar({
  group,
  patterns,
  shapes,
  palettes,
  selectedPartId,
  onSelectPart,
  onOpenNewPatternDialog,
  onRemovePart,
  onRenamePart,
  onMovePart,
  dimensionGuides,
  onRemoveGuide,
}: GroupPartsSidebarProps) {
  const hasParts = group.parts.length > 0;

  return (
    <aside className="group-editor__sidebar">
      <section>
        <div className="group-editor__section-header">
          <h2 className="group-editor__section-title">Parts</h2>
          <span className="group-editor__section-count">
            {group.parts.length === 1
              ? '1 part'
              : `${group.parts.length} parts`}
          </span>
          <button
            type="button"
            className="group-editor__button group-editor__button--primary"
            onClick={onOpenNewPatternDialog}
          >
            New
          </button>
        </div>

        {!hasParts ? (
          <p className="group-editor__empty">This group has no parts yet.</p>
        ) : (
          <ul className="group-editor__parts-list">
            {group.parts.map((part) => {
              const pattern = patterns[part.patternId];
              const shape = pattern ? shapes[pattern.shapeId] : undefined;
              const palette = pattern ? palettes[pattern.paletteId] : undefined;
              const isSelected = part.id === selectedPartId;

              return (
                <li
                  key={part.id}
                  className={
                    isSelected
                      ? 'group-editor__part-item group-editor__part-item--selected'
                      : 'group-editor__part-item'
                  }
                  onClick={() => onSelectPart(part.id)}
                >
                  <PartRow
                    part={part}
                    pattern={pattern}
                    shape={shape}
                    palette={palette}
                    onMovePart={onMovePart}
                    onRenamePart={onRenamePart}
                    onRemovePart={onRemovePart}
                    onSelectPart={onSelectPart}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {dimensionGuides && dimensionGuides.length > 0 && (
        <div className="group-parts-sidebar__section group-parts-sidebar__section--guides">
          <h3 className="group-parts-sidebar__section-title">Guides</h3>
          <ul className="group-parts-sidebar__guides-list">
            {dimensionGuides.map((guide) => (
              <li key={guide.id} className="group-parts-sidebar__guide-item">
                <span className="group-parts-sidebar__guide-label">
                  {guide.label}{' '}
                  <span className="group-parts-sidebar__guide-meta">
                    {guide.axis === 'horizontal' ? 'H' : 'V'} · {guide.reference}{' '}
                    · {guide.cells}
                  </span>
                </span>
                {onRemoveGuide && (
                  <button
                    type="button"
                    className="group-parts-sidebar__guide-remove"
                    onClick={() => onRemoveGuide(guide.id)}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

interface PartRowProps {
  part: PatternPart;
  pattern?: BeadPattern;
  shape?: PegboardShape;
  palette?: BeadPalette;
  onMovePart: (partId: string, direction: 'up' | 'down') => void;
  onRenamePart: (partId: string) => void;
  onRemovePart: (partId: string) => void;
  onSelectPart: (partId: string) => void;
}

function PartRow({
  part,
  pattern,
  shape,
  palette,
  onMovePart,
  onRenamePart,
  onRemovePart,
  onSelectPart,
}: PartRowProps) {
  return (
    <>
      <div className="group-editor__part-main">
        <span className="group-editor__part-main-text">
          {part.name}{' '}
          {pattern && (
            <span className="group-editor__part-meta">
              ({pattern.cols}×{pattern.rows})
            </span>
          )}
        </span>
      </div>

      <div className="group-editor__part-actions">
        <button
          type="button"
          className="group-editor__icon-button"
          title="Move up"
          onClick={(event) => {
            event.stopPropagation();
            onSelectPart(part.id);
            onMovePart(part.id, 'up');
          }}
        >
          ↑
        </button>
        <button
          type="button"
          className="group-editor__icon-button"
          title="Move down"
          onClick={(event) => {
            event.stopPropagation();
            onSelectPart(part.id);
            onMovePart(part.id, 'down');
          }}
        >
          ↓
        </button>
        <button
          type="button"
          className="group-editor__icon-button"
          title="Rename part"
          onClick={(event) => {
            event.stopPropagation();
            onSelectPart(part.id);
            onRenamePart(part.id);
          }}
        >
          ✏️
        </button>
        <button
          type="button"
          className="group-editor__icon-button group-editor__icon-button--danger"
          title="Remove part"
          onClick={(event) => {
            event.stopPropagation();
            onRemovePart(part.id);
          }}
        >
          ✕
        </button>
      </div>

      {pattern && shape && palette && (
        <div className="group-editor__thumbnail">
          <PatternCanvas
            pattern={pattern}
            shape={shape}
            palette={palette}
            editorState={THUMBNAIL_EDITOR_STATE}
          />
        </div>
      )}
    </>
  );
}
// src/routes/ImageConvertPage.tsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBeadStore } from '../store/beadStore';
import type { EditorUiState } from '../domain/uiState';
import type { BeadColorId } from '../domain/colors';
import type { BeadPattern } from '../domain/patterns';
import type { PegboardShape } from '../domain/shapes';
import { PatternCanvas } from '../editor/PatternCanvas';
import {
  imageDataToBeadGrid,
  type DitheringMode,
} from '../domain/imageConversion';
import './ImageConvertPage.css';

const PREVIEW_EDITOR_STATE: EditorUiState = {
  selectedTool: 'pencil',
  selectedColorId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: true,
  outlinesVisible: true,
};

// Small helper so we can await image loading from a blob URL.
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (ev) => reject(ev);
    img.src = url;
  });
}

export function ImageConvertPage() {
  const navigate = useNavigate();

  // Subscribe to each store field separately to avoid returning
  // a new object on every render, which can upset useSyncExternalStore.
  const palettes = useBeadStore((state) => state.palettes);
  const ensureRectangleShape = useBeadStore(
    (state) => state.ensureRectangleShape,
  );
  const createPattern = useBeadStore((state) => state.createPattern);

  const paletteList = useMemo(
    () => Object.values(palettes),
    [palettes],
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    const first = paletteList[0];
    return first ? first.id : '';
  });

  const selectedPalette = useMemo(
    () =>
      paletteList.find((p) => p.id === selectedPaletteId) ?? paletteList[0],
    [paletteList, selectedPaletteId],
  );

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [targetCols, setTargetCols] = useState<number>(29);
  const [targetRows, setTargetRows] = useState<number>(29);
  const [maxColorsInput, setMaxColorsInput] = useState<string>('');
  const [dithering, setDithering] = useState<DitheringMode>('none');

  const [isConverting, setIsConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewGrid, setPreviewGrid] = useState<BeadColorId[][] | null>(null);
  const [previewCols, setPreviewCols] = useState(0);
  const [previewRows, setPreviewRows] = useState(0);
  const [previewPaletteId, setPreviewPaletteId] = useState<string | null>(null);
  const [usedColorIds, setUsedColorIds] = useState<BeadColorId[]>([]);

  const hasPreview = !!(previewGrid && previewCols > 0 && previewRows > 0);

  const previewPalette = useMemo(
    () =>
      previewPaletteId
        ? paletteList.find((p) => p.id === previewPaletteId) ?? null
        : null,
    [paletteList, previewPaletteId],
  );

  const previewShape: PegboardShape | null = hasPreview
    ? {
        id: 'preview-shape',
        name: 'Preview',
        kind: previewCols === previewRows ? 'square' : 'rectangle',
        cols: previewCols,
        rows: previewRows,
      }
    : null;

  const previewPattern: BeadPattern | null =
    hasPreview && previewPalette && previewShape
      ? {
          id: 'preview-pattern',
          name: 'Preview',
          shapeId: previewShape.id,
          cols: previewCols,
          rows: previewRows,
          paletteId: previewPalette.id,
          grid: previewGrid!,
          createdAt: '',
          updatedAt: '',
          belongsToGroupId: null,
          belongsToPartId: null,
        }
      : null;

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const file = ev.target.files?.[0] ?? null;
    setSourceFile(file);
    setErrorMessage(null);
    setPreviewGrid(null);
    setUsedColorIds([]);
    setPreviewPaletteId(null);
    setPreviewCols(0);
    setPreviewRows(0);

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  };

  const handleConvertClick = async () => {
    if (!sourceFile || !imageUrl) {
      setErrorMessage('Please choose an image file first.');
      return;
    }
    if (!selectedPalette) {
      setErrorMessage('No palette available.');
      return;
    }

    const cols = Math.max(1, Math.min(128, Math.round(targetCols)));
    const rows = Math.max(1, Math.min(128, Math.round(targetRows)));

    setIsConverting(true);
    setErrorMessage(null);

    try {
      const img = await loadImage(imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context for conversion canvas.');
      }

      // Draw the whole image scaled into the target grid size
      ctx.drawImage(img, 0, 0, cols, rows);
      const imageData = ctx.getImageData(0, 0, cols, rows);

      const maxColors =
        maxColorsInput.trim() === ''
          ? null
          : Math.max(1, Number.parseInt(maxColorsInput, 10) || 1);

      const result = imageDataToBeadGrid(imageData, selectedPalette.colors, {
        cols,
        rows,
        maxColors,
        dithering,
      });

      setPreviewGrid(result.grid);
      setPreviewCols(cols);
      setPreviewRows(rows);
      setPreviewPaletteId(selectedPalette.id);
      setUsedColorIds(result.usedColorIds);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to convert image.',
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleCreatePattern = () => {
    if (!hasPreview || !previewGrid || !previewPaletteId) {
      setErrorMessage('Generate a preview before creating a pattern.');
      return;
    }

    const cols = previewCols;
    const rows = previewRows;
    const paletteId = previewPaletteId;

    const shapeId = ensureRectangleShape(cols, rows);

    const baseName = sourceFile
      ? sourceFile.name.replace(/\.[^/.]+$/, '')
      : 'Image pattern';

    const patternId = createPattern({
      name: `From image – ${baseName}`,
      shapeId,
      cols,
      rows,
      paletteId,
      grid: previewGrid,
    });

    navigate(`/editor/${patternId}`);
  };

  return (
    <div className="image-convert">
      <header className="image-convert__header">
        <div>
          <h1 className="image-convert__title">Image to Pattern</h1>
          <p className="image-convert__subtitle">
            Import a photo or drawing and convert it into a bead pattern using
            your chosen palette.
          </p>
        </div>
        <button
          type="button"
          className="image-convert__create-button"
          onClick={handleCreatePattern}
          disabled={!hasPreview}
        >
          Create pattern from preview
        </button>
      </header>

      <section className="image-convert__content">
        <div className="image-convert__controls">
          <div className="image-convert__field">
            <label className="image-convert__label">
              Source image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="image-convert__file-input"
              />
            </label>
          </div>

          <div className="image-convert__field image-convert__field--inline">
            <div>
              <label className="image-convert__label">
                Width (beads)
                <input
                  type="number"
                  min={1}
                  max={128}
                  value={targetCols}
                  onChange={(ev) =>
                    setTargetCols(Number.parseInt(ev.target.value, 10) || 1)
                  }
                  className="image-convert__number-input"
                />
              </label>
            </div>
            <span className="image-convert__times">×</span>
            <div>
              <label className="image-convert__label">
                Height (beads)
                <input
                  type="number"
                  min={1}
                  max={128}
                  value={targetRows}
                  onChange={(ev) =>
                    setTargetRows(Number.parseInt(ev.target.value, 10) || 1)
                  }
                  className="image-convert__number-input"
                />
              </label>
            </div>
          </div>

          <div className="image-convert__field">
            <label className="image-convert__label">
              Palette
              <select
                value={selectedPalette?.id ?? ''}
                onChange={(ev) => setSelectedPaletteId(ev.target.value)}
                className="image-convert__select"
              >
                {paletteList.map((palette) => (
                  <option key={palette.id} value={palette.id}>
                    {palette.name}
                    {palette.brand ? ` – ${palette.brand}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="image-convert__field image-convert__field--inline">
            <div>
              <label className="image-convert__label">
                Max colors (optional)
                <input
                  type="number"
                  min={1}
                  value={maxColorsInput}
                  onChange={(ev) => setMaxColorsInput(ev.target.value)}
                  placeholder="All"
                  className="image-convert__number-input"
                />
              </label>
            </div>
            <div>
              <label className="image-convert__label">
                Dithering
                <select
                  value={dithering}
                  onChange={(ev) =>
                    setDithering(ev.target.value as DitheringMode)
                  }
                  className="image-convert__select"
                >
                  <option value="none">None</option>
                  <option value="floyd-steinberg">Floyd–Steinberg</option>
                </select>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConvertClick}
            className="image-convert__convert-button"
            disabled={isConverting || !sourceFile}
          >
            {isConverting ? 'Converting…' : 'Generate preview'}
          </button>

          {errorMessage && (
            <p className="image-convert__error" role="alert">
              {errorMessage}
            </p>
          )}

          {hasPreview && usedColorIds.length > 0 && previewPalette && (
            <div className="image-convert__legend">
              <h2 className="image-convert__legend-title">Colors used</h2>
              <ul className="image-convert__legend-list">
                {usedColorIds.map((id) => {
                  const color = previewPalette.colors.find((c) => c.id === id);
                  if (!color) return null;
                  const { r, g, b } = color.rgb;
                  const swatchStyle = {
                    backgroundColor: `rgb(${r}, ${g}, ${b})`,
                  };
                  return (
                    <li key={id} className="image-convert__legend-item">
                      <span
                        className="image-convert__legend-swatch"
                        style={swatchStyle}
                      />
                      <span className="image-convert__legend-name">
                        {color.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="image-convert__preview">
          <div className="image-convert__preview-column">
            <h2 className="image-convert__preview-title">Source</h2>
            {imageUrl ? (
              <div className="image-convert__image-frame">
                <img
                  src={imageUrl}
                  alt={sourceFile?.name || 'Selected image'}
                  className="image-convert__image"
                />
              </div>
            ) : (
              <p className="image-convert__preview-placeholder">
                Choose an image to see a preview.
              </p>
            )}
          </div>

          <div className="image-convert__preview-column">
            <h2 className="image-convert__preview-title">Bead pattern preview</h2>
            {previewPattern && previewShape && previewPalette ? (
              <div className="image-convert__canvas-frame">
                <PatternCanvas
                  pattern={previewPattern}
                  shape={previewShape}
                  palette={previewPalette}
                  editorState={PREVIEW_EDITOR_STATE}
                />
              </div>
            ) : (
              <p className="image-convert__preview-placeholder">
                Generate a preview to see the bead pattern.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
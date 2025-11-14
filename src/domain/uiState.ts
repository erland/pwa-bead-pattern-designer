// src/domain/uiState.ts

import type { BeadColorId } from './colors';

export type EditorTool =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rect'
  | 'circle'
  | 'select';

export interface EditorUiState {
  selectedTool: EditorTool;
  selectedColorId: BeadColorId | null;

  zoom: number;
  panX: number;
  panY: number;

  gridVisible: boolean;
  outlinesVisible: boolean;
}

export interface GroupEditorUiState {
  selectedPartId: string | null;
}
// src/persistence/saveNow.ts
//
// Manual "Save now" helper: grabs current store state
// and writes it via StorageService.

import { useBeadStore } from '../store/beadStore';
import { StorageService } from './storage';
import type { PersistedBeadState } from './storage';

export async function saveStoreNow(): Promise<void> {
  const state = useBeadStore.getState();

  const snapshot: PersistedBeadState = {
    patterns: state.patterns,
    groups: state.groups,
    palettes: state.palettes,
    shapes: state.shapes,
  };

  await StorageService.saveAll(snapshot);
}
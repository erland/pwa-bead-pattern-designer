// src/persistence/bootstrap.ts
//
// Phase 7 – Local Persistence (IndexedDB & Offline Behavior)
// Step 2: Bootstrapping data on app startup.
//
// This module tries to load a persisted snapshot and, if found,
// hydrates the Zustand bead store with it.

import { StorageService } from './storage';
import { useBeadStore } from '../store/beadStore';

export async function initializeBeadStoreFromStorage(): Promise<void> {
  const snapshot = await StorageService.loadAll();

  // Nothing persisted yet -> keep the existing seed data from beadStore.
  if (!snapshot) return;

  // Hydrate the store with persisted data while keeping the action functions.
  useBeadStore.setState((state) => ({
    ...state,
    patterns: snapshot.patterns,
    groups: snapshot.groups,
    palettes: snapshot.palettes,
    shapes: snapshot.shapes,
  }));
}
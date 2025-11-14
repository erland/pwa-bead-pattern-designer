// src/persistence/autoSave.ts
//
// Phase 7 – Local Persistence, Step 3: Auto-save strategy.
// Subscribes to the bead store and, after a debounce, saves the
// current snapshot via StorageService.

import { useBeadStore } from '../store/beadStore';
import { StorageService } from './storage';
import type { PersistedBeadState } from './storage';

// Tiny debounce helper (no extra deps).
function debounce<T extends (...args: any[]) => void>(fn: T, delayMs: number): T {
  let timeoutId: number | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    if (typeof window === 'undefined') {
      // In non-browser environments, just call immediately.
      fn(...(args as Parameters<T>));
      return;
    }

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn(...(args as Parameters<T>));
    }, delayMs);
  }) as T;
}

let initialized = false;

export function initializeAutoSave(): void {
  // Avoid double subscription (e.g. HMR, multiple calls).
  if (initialized) return;
  initialized = true;

  // In SSR-like environments, skip auto-save entirely.
  if (typeof window === 'undefined') return;

  const debouncedSave = debounce(async (snapshot: PersistedBeadState) => {
    try {
      await StorageService.saveAll(snapshot);
    } catch (error) {
      // Non-fatal: just log for debugging.
      // eslint-disable-next-line no-console
      console.error('Auto-save failed', error);
    }
  }, 800); // ~0.8s debounce after last change

  // Subscribe to *all* state changes; we’ll take just the data part.
  useBeadStore.subscribe((state) => {
    const snapshot: PersistedBeadState = {
      patterns: state.patterns,
      groups: state.groups,
      palettes: state.palettes,
      shapes: state.shapes,
    };
    debouncedSave(snapshot);
  });
}
// src/persistence/storage.ts
//
// Phase 7 – Local Persistence (IndexedDB & Offline Behavior)
// Point 1: StorageService abstraction with loadAll / saveAll.
//
// This module is intentionally self-contained and "browser-safe":
// - It checks for IndexedDB before doing anything.
// - In non-browser environments (Jest / Node), it falls back to an in-memory store.
//
// Later phases can import `StorageService` and wire it into the app bootstrap.

import type { BeadPalette } from '../domain/colors';
import type { PegboardShape } from '../domain/shapes';
import type { BeadPattern, PatternGroup } from '../domain/patterns';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of the data we persist. Mirrors the core parts of the global store.
 * If the store grows later (e.g. settings), we can extend this type.
 */
export interface PersistedBeadState {
  patterns: Record<string, BeadPattern>;
  groups: Record<string, PatternGroup>;
  palettes: Record<string, BeadPalette>;
  shapes: Record<string, PegboardShape>;
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB constants
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'bead-pattern-designer';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const ROOT_KEY = 'root';

// Simple runtime check so importing this file in Node/Jest is safe.
function hasIndexedDB(): boolean {
  // eslint-disable-next-line no-undef
  return typeof indexedDB !== 'undefined';
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback (for environments without IndexedDB, e.g. tests)
// ─────────────────────────────────────────────────────────────────────────────

let memorySnapshot: PersistedBeadState | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB helpers
// ─────────────────────────────────────────────────────────────────────────────

function openDatabase(): Promise<IDBDatabase> {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'));
  }

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };
  });
}

async function idbSaveAll(snapshot: PersistedBeadState): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(snapshot, ROOT_KEY);

    req.onerror = () => {
      reject(req.error ?? new Error('Failed to save state to IndexedDB'));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction error while saving'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('IndexedDB transaction aborted while saving'));
    };
  });

  db.close();
}

async function idbLoadAll(): Promise<PersistedBeadState | null> {
  const db = await openDatabase();

  const result = await new Promise<PersistedBeadState | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(ROOT_KEY);

    req.onsuccess = () => {
      const value = (req.result ?? null) as PersistedBeadState | null;
      resolve(value);
    };

    req.onerror = () => {
      reject(req.error ?? new Error('Failed to load state from IndexedDB'));
    };
  });

  db.close();
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API – StorageService
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save the full bead app state to persistent storage.
 *
 * - In browsers with IndexedDB, this writes to IndexedDB.
 * - In other environments (e.g. tests), it stores the snapshot in memory only.
 */
async function saveAll(snapshot: PersistedBeadState): Promise<void> {
  if (hasIndexedDB()) {
    try {
      await idbSaveAll(snapshot);
    } catch (err) {
      // For now, just log; we don't want the app to crash on persistence errors.
      // eslint-disable-next-line no-console
      console.warn('StorageService.saveAll: failed to persist to IndexedDB', err);
    }
  } else {
    memorySnapshot = snapshot;
  }
}

/**
 * Load the bead app state from persistent storage.
 *
 * Returns:
 * - A full PersistedBeadState if found
 * - null if nothing is stored yet or on error
 *
 * In non-IndexedDB environments, this reads from the in-memory fallback.
 */
async function loadAll(): Promise<PersistedBeadState | null> {
  if (hasIndexedDB()) {
    try {
      return await idbLoadAll();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('StorageService.loadAll: failed to read from IndexedDB', err);
      return null;
    }
  }

  return memorySnapshot;
}

/**
 * A small abstraction around app persistence. Later phases (Phase 7)
 * will:
 *   - Call `StorageService.loadAll()` on startup to bootstrap the store.
 *   - Call `StorageService.saveAll()` when the store changes (with debounce).
 */
export const StorageService = {
  loadAll,
  saveAll,
};

// ─────────────────────────────────────────────────────────────────────────────
// Test-only helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test-only helper to reset the in-memory snapshot.
 * This is useful when running in environments without IndexedDB (Jest),
 * so each test can start from a clean state.
 */
export function __resetStorageServiceForTests(): void {
  memorySnapshot = null;
}
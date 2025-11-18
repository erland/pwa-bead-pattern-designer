// src/editor/selectionClipboard.ts
import type { BeadGrid } from './tools';

/**
 * Simple module-level clipboard so that selections can be copied
 * in one pattern editor and pasted into another.
 *
 * This deliberately does not depend on React so it can be used
 * from hooks, tests, and any non-React code.
 */

let clipboard: BeadGrid | null = null;
const listeners = new Set<() => void>();

export function getSelectionClipboard(): BeadGrid | null {
  return clipboard;
}

export function setSelectionClipboard(next: BeadGrid | null): void {
  clipboard = next;
  listeners.forEach((fn) => fn());
}

/**
 * Subscribe to clipboard changes. Returns an unsubscribe function.
 */
export function subscribeSelectionClipboard(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
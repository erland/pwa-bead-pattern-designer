// src/settings/appSettings.ts
//
// Phase 7 – Step 4: App settings persisted in localStorage.
// - theme: "light" | "dark"
// - lastOpenedPatternId: string | null

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  lastOpenedPatternId: string | null;
}

const SETTINGS_KEY = 'bead-designer.settings.v1';

function getDefaultSettings(): AppSettings {
  return {
    theme: 'light',
    lastOpenedPatternId: null,
  };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    // During SSR/tests: just return defaults
    return getDefaultSettings();
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      lastOpenedPatternId: parsed.lastOpenedPatternId ?? null,
    };
  } catch {
    // On any parse/IO error, fall back to defaults.
    return getDefaultSettings();
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Swallow errors – persistence is best-effort.
    // eslint-disable-next-line no-console
    console.error('Failed to save app settings');
  }
}

// In-memory cache so callers can read settings without
// poking localStorage all the time.
// Initialise from localStorage so values are available on first render.
let currentSettings: AppSettings = loadAppSettings();

/** Initialise settings on app startup. */
export function initAppSettings(): AppSettings {
  // currentSettings is already loaded above; we mainly need to apply theme.
  applyThemeToDocument(currentSettings.theme);
  return currentSettings;
}

/** Get the latest cached settings. */
export function getCurrentAppSettings(): AppSettings {
  return currentSettings;
}

/** Convenience: get last opened pattern id from settings. */
export function getLastOpenedPatternId(): string | null {
  return currentSettings.lastOpenedPatternId;
}

/** Update theme and persist. */
export function setTheme(theme: ThemeMode): void {
  currentSettings = { ...currentSettings, theme };
  applyThemeToDocument(theme);
  saveAppSettings(currentSettings);
}

/** Update last opened pattern id and persist. */
export function setLastOpenedPatternId(patternId: string | null): void {
  currentSettings = { ...currentSettings, lastOpenedPatternId: patternId };
  saveAppSettings(currentSettings);
}

/** Apply theme to <html> element so CSS can react. */
function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}
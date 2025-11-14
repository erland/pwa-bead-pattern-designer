// src/settings/ThemeToggle.tsx
//
// Small button that toggles between light/dark theme and persists it.

import { useEffect, useState } from 'react';
import {
  getCurrentAppSettings,
  setTheme,
  type ThemeMode,
} from './appSettings';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const settings = getCurrentAppSettings();
    setThemeState(settings.theme);
  }, []);

  const handleToggle = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(next);        // updates localStorage + document
    setThemeState(next);   // updates this button UI
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="theme-toggle"
    >
      {theme === 'light' ? '🌞 Light' : '🌙 Dark'}
    </button>
  );
}
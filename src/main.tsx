// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initializeBeadStoreFromStorage } from './persistence/bootstrap';
import { initializeAutoSave } from './persistence/autoSave';
import { initAppSettings } from './settings/appSettings';
import './index.css';

// Initialise app settings (theme, last opened pattern id, etc.)
initAppSettings();

// Fire-and-forget: hydrate store from IndexedDB / fallback.
// We don't await here; the app renders with seed data and then
// switches to persisted data once it loads (if any).
void initializeBeadStoreFromStorage();
initializeAutoSave();

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
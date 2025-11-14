// src/persistence/SaveNowButton.tsx
//
// Small UI component you can drop into your top bar or editor header
// to give the user a "Save now" button.

import { useState } from 'react';
import { saveStoreNow } from './saveNow';

export function SaveNowButton() {
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      await saveStoreNow();
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Manual save failed', err);
      setErrorMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="save-now">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="save-now__button"
      >
        {saving ? 'Saving…' : '💾 Save now'}
      </button>
      {lastSavedAt && !errorMessage && (
        <span className="save-now__status">Last saved at {lastSavedAt}</span>
      )}
      {errorMessage && <span className="save-now__error">{errorMessage}</span>}
    </div>
  );
}
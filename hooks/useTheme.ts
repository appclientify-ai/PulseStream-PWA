import { useState, useEffect } from 'react';
import { UISettings } from '../types';
import { getStoredUiSettings, applyUiSettings } from '../services/theme';

export function useTheme() {
  const [settings, setSettingsState] = useState<UISettings>(() => getStoredUiSettings());

  useEffect(() => {
    // Apply settings on mount
    applyUiSettings(settings);

    const handleSettingsChange = (e: Event) => {
      const customEv = e as CustomEvent<UISettings>;
      if (customEv.detail) {
        setSettingsState(customEv.detail);
      }
    };

    window.addEventListener('clientify_ui_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('clientify_ui_settings_changed', handleSettingsChange);
    };
  }, []);

  const updateSettings = (newSettings: Partial<UISettings>) => {
    const updated = applyUiSettings(newSettings);
    setSettingsState(updated);
  };

  return {
    settings,
    updateSettings
  };
}

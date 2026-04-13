import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { getSettings, saveSettings } from '../storage/settingsStorage';
import { supabase } from '../lib/supabase';
import { pushSettings } from '../storage/cloudSync';

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: async () => {},
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id;
        if (uid) pushSettings(uid, updated).catch(() => {});
      });
      return updated;
    });
  }, []);

  return React.createElement(
    SettingsContext.Provider,
    { value: { settings, updateSetting, loading } },
    children,
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}

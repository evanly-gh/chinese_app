import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { KEYS } from './keys';

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);

    // Migrate darkModeOverride → theme
    if ('darkModeOverride' in parsed && !('theme' in parsed)) {
      const override = parsed.darkModeOverride as string;
      parsed.theme = override === 'dark' ? 'dark' : 'light';
      delete parsed.darkModeOverride;
    }

    // Migrate activeLevel (number) → activeLevels (number[])
    if ('activeLevel' in parsed && !('activeLevels' in parsed)) {
      parsed.activeLevels = [parsed.activeLevel];
      delete parsed.activeLevel;
    }

    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, [key]: value };
  await saveSettings(updated);
  return updated;
}

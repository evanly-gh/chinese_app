import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './keys';

const CURRENT_VERSION = 1;

export async function runMigrations(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.SCHEMA_VERSION);
  const version = raw ? parseInt(raw, 10) : 0;
  if (version >= CURRENT_VERSION) return;
  // Future migrations go here as version-gated blocks
  await AsyncStorage.setItem(KEYS.SCHEMA_VERSION, String(CURRENT_VERSION));
}

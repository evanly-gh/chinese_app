import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from './useSettings';

export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme() ?? 'light';
  const { settings } = useSettings();
  if (settings.darkModeOverride === 'light') return 'light';
  if (settings.darkModeOverride === 'dark') return 'dark';
  return system;
}

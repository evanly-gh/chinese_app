import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from './useSettings';

export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme() ?? 'light';
  const { settings } = useSettings();
  if (settings.theme === 'light') return 'light';
  if (settings.theme === 'dark') return 'dark';
  if (settings.theme === 'custom') return settings.customTheme.base;
  return system;
}

import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettings } from './useSettings';
import { buildColors, ThemeColors } from '../theme/colors';

export function useTheme(): { scheme: 'light' | 'dark'; colors: ThemeColors } {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const { settings } = useSettings();

  let scheme: 'light' | 'dark';
  let colors: ThemeColors;

  if (settings.theme === 'custom') {
    scheme = settings.customTheme.base;
    colors = buildColors(scheme, settings.customTheme.primary);
  } else if (settings.theme === 'light' || settings.theme === 'dark') {
    scheme = settings.theme;
    colors = buildColors(scheme);
  } else {
    scheme = systemScheme;
    colors = buildColors(scheme);
  }

  return { scheme, colors };
}

export interface ThemeColors {
  background: string;
  card: string;
  cardShadow: string;
  text: string;
  textSecondary: string;
  tint: string;
  tabBar: string;
  tabBarBorder: string;
  border: string;
  progressBar: string;
  progressBackground: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
  swipeAgain: string;
  swipeEasy: string;
}

export function buildColors(base: 'light' | 'dark', primary?: string): ThemeColors {
  const tint = primary ?? (base === 'dark' ? '#EF5350' : '#D32F2F');
  const progressBar = primary ?? (base === 'dark' ? '#EF5350' : '#D32F2F');

  if (base === 'dark') {
    return {
      background: '#121212',
      card: '#1E1E1E',
      cardShadow: '#00000040',
      text: '#F5F5F5',
      textSecondary: '#AAAAAA',
      tint,
      tabBar: '#1A1A1A',
      tabBarBorder: '#333333',
      border: '#333333',
      progressBar,
      progressBackground: '#333333',
      again: '#EF5350',
      hard: '#FFA726',
      good: '#42A5F5',
      easy: '#66BB6A',
      swipeAgain: '#EF5350CC',
      swipeEasy: '#66BB6ACC',
    };
  }

  return {
    background: '#FFFFFF',
    card: '#F8F8F8',
    cardShadow: '#00000015',
    text: '#1A1A1A',
    textSecondary: '#666666',
    tint,
    tabBar: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
    border: '#E0E0E0',
    progressBar,
    progressBackground: '#F0F0F0',
    again: '#F44336',
    hard: '#FF9800',
    good: '#2196F3',
    easy: '#4CAF50',
    swipeAgain: '#F44336CC',
    swipeEasy: '#4CAF50CC',
  };
}

export const Colors = {
  light: buildColors('light'),
  dark: buildColors('dark'),
};

export type ColorScheme = keyof typeof Colors;

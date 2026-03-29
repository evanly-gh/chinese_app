export const Colors = {
  light: {
    background: '#FFFFFF',
    card: '#F8F8F8',
    cardShadow: '#00000015',
    text: '#1A1A1A',
    textSecondary: '#666666',
    tint: '#D32F2F',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
    border: '#E0E0E0',
    progressBar: '#D32F2F',
    progressBackground: '#F0F0F0',
    // Difficulty button colors
    again: '#F44336',
    hard: '#FF9800',
    good: '#2196F3',
    easy: '#4CAF50',
    // Swipe hint colors
    swipeAgain: '#F44336CC',
    swipeEasy: '#4CAF50CC',
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    cardShadow: '#00000040',
    text: '#F5F5F5',
    textSecondary: '#AAAAAA',
    tint: '#EF5350',
    tabBar: '#1A1A1A',
    tabBarBorder: '#333333',
    border: '#333333',
    progressBar: '#EF5350',
    progressBackground: '#333333',
    again: '#EF5350',
    hard: '#FFA726',
    good: '#42A5F5',
    easy: '#66BB6A',
    swipeAgain: '#EF5350CC',
    swipeEasy: '#66BB6ACC',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;

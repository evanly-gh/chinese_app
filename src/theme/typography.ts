export const Typography = {
  // CJK characters — uses system font on device, falls back gracefully
  hanzi: {
    fontFamily: 'NotoSansSC_400Regular',
  },
  hanziBold: {
    fontFamily: 'NotoSansSC_700Bold',
  },
  // Sizes
  displayLarge: 72,
  displayMedium: 56,
  headline: 28,
  title: 22,
  body: 16,
  label: 14,
  caption: 12,
} as const;

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { DifficultyRating } from '../../types/review';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

type ButtonMode = 'flashcard' | 'srs';

interface DifficultyButtonsProps {
  onRate: (rating: DifficultyRating) => void;
  visible: boolean;
  mode?: ButtonMode;
}

const SRS_BUTTONS: { label: string; rating: DifficultyRating; colorKey: keyof typeof Colors.light }[] = [
  { label: 'Again', rating: 'again', colorKey: 'again' },
  { label: 'Hard', rating: 'hard', colorKey: 'hard' },
  { label: 'Good', rating: 'good', colorKey: 'good' },
  { label: 'Easy', rating: 'easy', colorKey: 'easy' },
];

const FLASHCARD_BUTTONS: { label: string; rating: DifficultyRating; colorKey: keyof typeof Colors.light }[] = [
  { label: "Don't Know", rating: 'again', colorKey: 'again' },
  { label: 'Unsure', rating: 'hard', colorKey: 'hard' },
  { label: 'Know', rating: 'easy', colorKey: 'easy' },
];

export function DifficultyButtons({ onRate, visible, mode = 'flashcard' }: DifficultyButtonsProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  if (!visible) return null;

  const buttons = mode === 'flashcard' ? FLASHCARD_BUTTONS : SRS_BUTTONS;

  return (
    <View style={styles.container}>
      {buttons.map(({ label, rating, colorKey }) => (
        <TouchableOpacity
          key={rating}
          onPress={() => onRate(rating)}
          style={[styles.button, { backgroundColor: colors[colorKey] }]}
          activeOpacity={0.75}
        >
          <ThemedText style={styles.label}>{label}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

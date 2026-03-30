import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { DifficultyRating } from '../../types/review';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';

// mode='pre-flip'  — 3 buttons shown BEFORE revealing the card: Mastered | Not Sure | Don't Know
// mode='post-flip' — 2 buttons shown AFTER revealing: Continue | Mistaken
// mode='srs'       — legacy 3-button SRS mode (used in exercise phase)

export type ButtonMode = 'pre-flip' | 'post-flip' | 'srs';

interface DifficultyButtonsProps {
  onRate: (rating: DifficultyRating) => void;
  onContinue?: () => void;   // post-flip: advance with pre-selected rating
  onMistaken?: () => void;   // post-flip: downgrade rating and advance
  visible: boolean;
  mode?: ButtonMode;
}

const PRE_FLIP_BUTTONS: { label: string; rating: DifficultyRating; colorKey: keyof ThemeColors }[] = [
  { label: 'Mastered',   rating: 'known',       colorKey: 'easy' },
  { label: 'Not Sure',   rating: 'in_progress', colorKey: 'hard' },
  { label: "Don't Know", rating: 'unknown',      colorKey: 'again' },
];

const SRS_BUTTONS: { label: string; rating: DifficultyRating; colorKey: keyof ThemeColors }[] = [
  { label: 'Unknown',     rating: 'unknown',      colorKey: 'again' },
  { label: 'In Progress', rating: 'in_progress',  colorKey: 'hard' },
  { label: 'Known',       rating: 'known',        colorKey: 'easy' },
];

export function DifficultyButtons({
  onRate,
  onContinue,
  onMistaken,
  visible,
  mode = 'pre-flip',
}: DifficultyButtonsProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  if (mode === 'post-flip') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={onContinue}
          style={[styles.button, { backgroundColor: colors.easy }]}
          activeOpacity={0.75}
        >
          <ThemedText style={styles.label}>Continue</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMistaken}
          style={[styles.button, { backgroundColor: colors.again }]}
          activeOpacity={0.75}
        >
          <ThemedText style={styles.label}>Mistaken</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const buttons = mode === 'pre-flip' ? PRE_FLIP_BUTTONS : SRS_BUTTONS;

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
    paddingHorizontal: 4,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { Exercise } from '../../utils/exerciseUtils';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { Ionicons } from '@expo/vector-icons';

interface ListenWordProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export function ListenWord({ exercise, onAnswer }: ListenWordProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { settings } = useSettings();
  const { speak } = useTTS();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const { card, options = [], correctIndex = 0, useTraditional } = exercise;
  const hanzi = useTraditional ? card.traditional : card.simplified;

  // Auto-play on mount
  useEffect(() => {
    speak(hanzi);
  }, []);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setRevealed(true);
    setTimeout(() => {
      onAnswer(index === correctIndex);
    }, 700);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="secondary" style={styles.instruction}>
        Listen and choose the character
      </ThemedText>

      {/* Big audio button */}
      <View style={styles.audioCenter}>
        <TouchableOpacity
          onPress={() => speak(hanzi)}
          style={[styles.audioBtn, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="volume-high" size={48} color="#FFFFFF" />
        </TouchableOpacity>
        {revealed && (
          <View style={styles.revealedWord}>
            <ThemedText style={styles.revealedChar}>{hanzi}</ThemedText>
            {settings.showPinyin && (
              <ThemedText style={[styles.revealedPinyin, { color: colors.textSecondary }]}>
                {card.pinyin}
              </ThemedText>
            )}
          </View>
        )}
      </View>

      <View style={styles.options}>
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isSelected = i === selected;
          let bg = colors.card;
          if (selected !== null && isCorrect) bg = colors.easy + '30';
          if (isSelected && !isCorrect) bg = colors.again + '30';
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(i)}
              style={[
                styles.option,
                { borderColor: colors.border, backgroundColor: bg },
                selected !== null && isCorrect && { borderColor: colors.easy },
                isSelected && !isCorrect && { borderColor: colors.again },
              ]}
              activeOpacity={0.75}
            >
              <ThemedText style={styles.optionText}>{opt}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20, justifyContent: 'center' },
  instruction: { textAlign: 'center', fontSize: 14 },
  audioCenter: { alignItems: 'center', gap: 16 },
  audioBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealedWord: { alignItems: 'center', gap: 4 },
  revealedChar: { fontSize: 40, fontWeight: '400' },
  revealedPinyin: { fontSize: 16 },
  options: { gap: 10 },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionText: { fontSize: 20, fontWeight: '600' },
});

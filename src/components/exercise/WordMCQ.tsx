import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { Exercise } from '../../utils/exerciseUtils';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { Ionicons } from '@expo/vector-icons';

interface WordMCQProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export function WordMCQ({ exercise, onAnswer }: WordMCQProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { settings } = useSettings();
  const { speak } = useTTS();
  const [selected, setSelected] = useState<number | null>(null);

  const { card, options = [], correctIndex = 0, type, useTraditional } = exercise;
  const hanzi = useTraditional ? card.traditional : card.simplified;
  const isCnEn = type === 'word-cn-en';

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => {
      onAnswer(index === correctIndex);
    }, 700);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="secondary" style={styles.instruction}>
        {isCnEn ? 'What does this mean?' : 'Which character matches?'}
      </ThemedText>

      {/* Prompt */}
      <View style={styles.promptBox}>
        {isCnEn ? (
          <>
            <ThemedText style={styles.promptChar}>{hanzi}</ThemedText>
            {settings.showPinyin && (
              <ThemedText style={[styles.promptPinyin, { color: colors.textSecondary }]}>
                {card.pinyin}
              </ThemedText>
            )}
          </>
        ) : (
          <ThemedText style={styles.promptEnglish}>{card.english}</ThemedText>
        )}
        <TouchableOpacity
          onPress={() => speak(hanzi)}
          style={[styles.ttsBtn, { backgroundColor: colors.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="volume-high-outline" size={20} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Options */}
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
  promptBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    position: 'relative',
  },
  promptChar: { fontSize: 64, fontWeight: '400', textAlign: 'center' },
  promptPinyin: { fontSize: 20 },
  promptEnglish: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  ttsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  options: { gap: 10 },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});

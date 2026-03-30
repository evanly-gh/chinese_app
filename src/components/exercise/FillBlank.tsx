import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { Exercise } from '../../utils/exerciseUtils';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { Ionicons } from '@expo/vector-icons';

interface FillBlankProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export function FillBlank({ exercise, onAnswer }: FillBlankProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { speak } = useTTS();
  const [selected, setSelected] = useState<number | null>(null);

  const { card, options = [], correctIndex = 0, prompt = '', useTraditional } = exercise;
  const hanzi = useTraditional ? card.traditional : card.simplified;
  const exampleSentence = useTraditional ? card.exampleTraditional : card.exampleSimplified;

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
        Fill in the missing word
      </ThemedText>

      <View style={styles.sentenceBox}>
        <ThemedText style={styles.sentence}>{prompt}</ThemedText>
        {settings.showPinyin && (
          <ThemedText style={[styles.pinyin, { color: colors.textSecondary }]}>
            {card.examplePinyin}
          </ThemedText>
        )}
        <ThemedText type="secondary" style={styles.translation}>{card.exampleEnglish}</ThemedText>
        <TouchableOpacity
          onPress={() => speak(exampleSentence)}
          style={[styles.ttsBtn, { backgroundColor: colors.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="volume-high-outline" size={20} color={colors.tint} />
        </TouchableOpacity>
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
  sentenceBox: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  sentence: { fontSize: 24, textAlign: 'center', fontWeight: '500' },
  pinyin: { fontSize: 14, textAlign: 'center' },
  translation: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
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
  optionText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

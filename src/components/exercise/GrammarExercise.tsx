import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { GrammarExercise as GrammarExerciseType } from '../../utils/grammarUtils';
import { useTheme } from '../../hooks/useTheme';

interface GrammarExerciseProps {
  exercise: GrammarExerciseType;
  onAnswer: (correct: boolean) => void;
}

export function GrammarExercise({ exercise, onAnswer }: GrammarExerciseProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => {
      onAnswer(index === exercise.correctIndex);
    }, 700);
  };

  const optionBg = (i: number) => {
    if (selected === null) return colors.card;
    if (i === exercise.correctIndex) return colors.easy + '30';
    if (i === selected) return colors.again + '30';
    return colors.card;
  };

  const optionBorder = (i: number) => {
    if (selected === null) return colors.border;
    if (i === exercise.correctIndex) return colors.easy;
    if (i === selected) return colors.again;
    return colors.border;
  };

  if (exercise.type === 'grammar-fill') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="secondary" style={styles.tag}>Grammar · Fill in the blank</ThemedText>
        <ThemedText style={[styles.ruleTitle, { color: colors.tint }]}>{exercise.ruleTitle}</ThemedText>

        <View style={[styles.promptBox, { borderColor: colors.border }]}>
          <ThemedText style={styles.prompt}>{exercise.sentence}</ThemedText>
          {exercise.sentenceEnglish ? (
            <ThemedText type="secondary" style={styles.translation}>{exercise.sentenceEnglish}</ThemedText>
          ) : null}
        </View>

        <View style={styles.options}>
          {exercise.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(i)}
              style={[
                styles.option,
                { borderColor: optionBorder(i), backgroundColor: optionBg(i) },
              ]}
              activeOpacity={0.75}
            >
              <ThemedText style={styles.optionText}>{opt}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    );
  }

  // grammar-correct: pick the grammatically correct sentence
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="secondary" style={styles.tag}>Grammar · Which is correct?</ThemedText>
      <ThemedText style={[styles.ruleTitle, { color: colors.tint }]}>{exercise.ruleTitle}</ThemedText>

      {exercise.correctEnglish ? (
        <View style={[styles.promptBox, { borderColor: colors.border }]}>
          <ThemedText type="secondary" style={styles.meaning}>{exercise.correctEnglish}</ThemedText>
        </View>
      ) : null}

      <View style={styles.options}>
        {(exercise.sentences ?? exercise.options).map((sent, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleSelect(i)}
            style={[
              styles.option,
              { borderColor: optionBorder(i), backgroundColor: optionBg(i) },
            ]}
            activeOpacity={0.75}
          >
            <ThemedText style={styles.sentenceText}>{sent}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  tag: { textAlign: 'center', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  ruleTitle: { textAlign: 'center', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  promptBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  prompt: { fontSize: 22, textAlign: 'center', fontWeight: '500' },
  translation: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
  meaning: { fontSize: 16, textAlign: 'center', fontStyle: 'italic' },
  options: { gap: 10 },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  optionText: { fontSize: 20, fontWeight: '600' },
  sentenceText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});

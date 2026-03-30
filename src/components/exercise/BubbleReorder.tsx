import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { Exercise } from '../../utils/exerciseUtils';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { Ionicons } from '@expo/vector-icons';

interface BubbleReorderProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export function BubbleReorder({ exercise, onAnswer }: BubbleReorderProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { speak } = useTTS();
  const [placed, setPlaced] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const { card, bubbles = [], prompt = '', type, useTraditional } = exercise;
  const isCn = type === 'bubble-cn';
  const correct = isCn
    ? (useTraditional ? card.exampleTraditional : card.exampleSimplified)
    : card.exampleEnglish;
  const separator = isCn ? '' : ' ';
  const speakText = useTraditional ? card.exampleTraditional : card.exampleSimplified;

  const handleBubbleTap = (bubble: string, index: number) => {
    if (submitted || usedIndices.has(index)) return;
    setPlaced(prev => [...prev, bubble]);
    setUsedIndices(prev => new Set([...prev, index]));
  };

  const handleRemoveLast = () => {
    if (submitted || placed.length === 0) return;
    const lastPlaced = placed[placed.length - 1];
    // Find the last used index that produced this bubble
    const indices = [...usedIndices];
    for (let i = indices.length - 1; i >= 0; i--) {
      if (bubbles[indices[i]] === lastPlaced) {
        setUsedIndices(prev => {
          const next = new Set(prev);
          next.delete(indices[i]);
          return next;
        });
        break;
      }
    }
    setPlaced(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (placed.length === 0) return;
    const answer = placed.join(separator);
    const correct_ = answer === correct;
    setIsCorrect(correct_);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct_), 1000);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="secondary" style={styles.instruction}>
        {isCn ? 'Arrange characters to match:' : 'Arrange words to translate:'}
      </ThemedText>

      {/* Prompt (the target sentence/English) */}
      <View style={styles.promptBox}>
        <ThemedText style={styles.prompt}>{prompt}</ThemedText>
        <TouchableOpacity
          onPress={() => speak(speakText)}
          style={[styles.ttsBtn, { backgroundColor: colors.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="volume-high-outline" size={20} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Answer area */}
      <View style={[
        styles.answerArea,
        { borderColor: submitted ? (isCorrect ? colors.easy : colors.again) : colors.border },
      ]}>
        {placed.length === 0 ? (
          <ThemedText type="secondary" style={styles.placeholder}>Tap bubbles below…</ThemedText>
        ) : (
          <ThemedText style={styles.answerText}>{placed.join(separator)}</ThemedText>
        )}
      </View>

      {/* Bubble bank */}
      <View style={styles.bubbleRow}>
        {bubbles.map((b, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleBubbleTap(b, i)}
            disabled={usedIndices.has(i) || submitted}
            style={[
              styles.bubble,
              { borderColor: colors.tint, backgroundColor: colors.tint + '15' },
              usedIndices.has(i) && styles.bubbleUsed,
            ]}
          >
            <ThemedText style={[styles.bubbleText, usedIndices.has(i) && { color: colors.textSecondary }]}>
              {b}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleRemoveLast}
          style={[styles.actionBtn, { borderColor: colors.border }]}
          disabled={submitted}
        >
          <ThemedText style={styles.actionText}>⌫ Undo</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.actionBtn, { backgroundColor: colors.tint, borderColor: colors.tint }]}
          disabled={placed.length === 0 || submitted}
        >
          <ThemedText style={[styles.actionText, { color: '#FFFFFF' }]}>Check</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  instruction: { textAlign: 'center', fontSize: 14 },
  promptBox: { alignItems: 'center', gap: 8 },
  prompt: { fontSize: 18, textAlign: 'center', fontWeight: '500' },
  ttsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerArea: {
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { fontSize: 14 },
  answerText: { fontSize: 20, textAlign: 'center' },
  bubbleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  bubbleUsed: { opacity: 0.3 },
  bubbleText: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '700' },
});

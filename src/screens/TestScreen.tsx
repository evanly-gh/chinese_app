import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/common/ThemedView';
import { ThemedText } from '../components/common/ThemedText';
import { ExerciseHost } from '../components/exercise/ExerciseHost';
import { SessionProgressBar } from '../components/study/SessionProgressBar';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { VocabCard } from '../types/vocab';
import { getCardsForLevel } from '../data';
import { saveTestResult } from '../storage/testResultStorage';
import { supabase } from '../lib/supabase';
import { pushTestResult } from '../storage/cloudSync';
import {
  Exercise,
  buildWordCnEn,
  buildWordEnCn,
  buildSentenceMCQ,
  shuffle,
} from '../utils/exerciseUtils';
import { today } from '../utils/dateUtils';

type TestState = 'config' | 'running' | 'results';

const TEST_SIZES = [10, 20, 30, 40];

interface TestScreenProps {
  onBack: () => void;
}

export default function TestScreen({ onBack }: TestScreenProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();

  const [testState, setTestState] = useState<TestState>('config');
  const [testSize, setTestSize] = useState(20);
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [incorrectCards, setIncorrectCards] = useState<VocabCard[]>([]);

  const buildTest = useCallback(() => {
    const cards = settings.activeLevels.flatMap(l => getCardsForLevel(l));
    if (cards.length === 0) return;
    const pool = cards;
    const shuffledCards = shuffle(cards).slice(0, testSize);

    const built: Exercise[] = shuffledCards.flatMap((card, i) => {
      const variant = i % 3;
      if (variant === 0) return [buildWordCnEn(card, pool, settings.useTraditional)];
      if (variant === 1) return [buildWordEnCn(card, pool, settings.useTraditional)];
      return [buildSentenceMCQ(card, pool, settings.useTraditional)];
    });

    setQuestions(built);
    setCurrent(0);
    setAnswers([]);
    setIncorrectCards([]);
    setTestState('running');
  }, [settings.activeLevels, settings.useTraditional, testSize]);

  const handleAnswer = useCallback((correct: boolean) => {
    const card = questions[current].card;
    setAnswers(prev => [...prev, correct]);
    if (!correct) {
      setIncorrectCards(prev => [...prev, card]);
    }
    const next = current + 1;
    if (next >= questions.length) {
      // Save result
      const score = answers.filter(Boolean).length + (correct ? 1 : 0);
      const result = {
        date: today(),
        level: settings.activeLevels[0],
        score,
        total: questions.length,
        incorrect: incorrectCards.concat(!correct ? [card] : []).map(c => c.id),
      };
      saveTestResult(result);
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id;
        if (uid) pushTestResult(uid, result).catch(() => {});
      });
      setTestState('results');
    } else {
      setCurrent(next);
    }
  }, [current, questions, answers, incorrectCards, settings.activeLevels]);

  const score = answers.filter(Boolean).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Config ─────────────────────────────────────────────────────────────

  if (testState === 'config') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.top}>
            <TouchableOpacity onPress={onBack}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.configContent}>
            <ThemedText type="title" style={styles.configTitle}>Test</ThemedText>
            <ThemedText type="secondary" style={styles.configSubtitle}>
              Full HSK {settings.activeLevels.join(', ')} assessment — Chinese↔English and sentence translation
            </ThemedText>
            <ThemedText style={styles.configLabel}>Number of Questions</ThemedText>
            <View style={styles.sizeRow}>
              {TEST_SIZES.map(size => {
                const active = testSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setTestSize(size)}
                    style={[
                      styles.sizeChip,
                      { borderColor: active ? colors.tint : colors.border },
                      active && { backgroundColor: colors.tint },
                    ]}
                  >
                    <ThemedText style={[styles.sizeText, active && styles.sizeTextActive]}>
                      {size}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={buildTest}
              style={[styles.startButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.startButtonText}>Start Test</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Running ─────────────────────────────────────────────────────────────

  if (testState === 'running') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.top}>
            <TouchableOpacity onPress={onBack}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
            </TouchableOpacity>
            <SessionProgressBar completed={current} total={questions.length} />
          </View>
          <ExerciseHost
            key={current}
            exercise={questions[current]}
            onAnswer={handleAnswer}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <ThemedText style={styles.resultEmoji}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}
          </ThemedText>
          <ThemedText type="title" style={styles.resultTitle}>
            {score} / {questions.length}
          </ThemedText>
          <ThemedText type="secondary" style={styles.resultPct}>
            {pct}% — HSK {settings.activeLevels.join(', ')}
          </ThemedText>

          {incorrectCards.length > 0 && (
            <ThemedView variant="card" style={styles.incorrectCard}>
              <ThemedText style={styles.incorrectTitle}>Review These Words</ThemedText>
              {incorrectCards.map(card => (
                <View key={card.id} style={styles.incorrectRow}>
                  <ThemedText style={styles.incorrectHanzi}>
                    {settings.useTraditional ? card.traditional : card.simplified}
                  </ThemedText>
                  <ThemedText type="secondary" style={styles.incorrectPinyin}>{card.pinyin}</ThemedText>
                  <ThemedText style={styles.incorrectEnglish}>{card.english}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity
              onPress={() => { setTestState('config'); }}
              style={[styles.actionBtn, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.actionBtnText}>Try Again</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onBack}
              style={[styles.actionBtn, { backgroundColor: colors.border }]}
            >
              <ThemedText style={styles.actionBtnText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: 8 },
  top: { paddingTop: 12, paddingHorizontal: 16, gap: 8 },
  backText: { fontSize: 18, fontWeight: '600' },

  // Config
  configContent: { flex: 1, padding: 24, gap: 20, justifyContent: 'center' },
  configTitle: { fontSize: 28 },
  configSubtitle: { fontSize: 15, lineHeight: 22 },
  configLabel: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  sizeText: { fontSize: 16, fontWeight: '700' },
  sizeTextActive: { color: '#FFFFFF' },
  startButton: {
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Results
  resultsScroll: { padding: 24, gap: 20, alignItems: 'center' },
  resultEmoji: { fontSize: 72, textAlign: 'center', marginTop: 20 },
  resultTitle: { fontSize: 40, textAlign: 'center' },
  resultPct: { fontSize: 18, textAlign: 'center' },
  incorrectCard: { width: '100%', borderRadius: 16, padding: 20, gap: 12 },
  incorrectTitle: { fontSize: 16, fontWeight: '600' },
  incorrectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  incorrectHanzi: { fontSize: 22, width: 60 },
  incorrectPinyin: { width: 100, fontSize: 13 },
  incorrectEnglish: { flex: 1, fontSize: 14 },
  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

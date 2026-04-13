import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../components/common/ThemedView';
import { ThemedText } from '../components/common/ThemedText';
import { ExerciseHost } from '../components/exercise/ExerciseHost';
import { SessionProgressBar } from '../components/study/SessionProgressBar';
import { FlashCard } from '../components/study/FlashCard';
import { DifficultyButtons } from '../components/study/DifficultyButtons';
import { SwipeDeck } from '../components/study/SwipeDeck';
import { QuickSettingsPopover } from '../components/common/QuickSettingsPopover';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { VocabCard } from '../types/vocab';
import { DifficultyRating } from '../types/review';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getAllSRSStates, saveSRSState } from '../storage/cardStateStorage';
import { appendReviewEvent } from '../storage/reviewHistoryStorage';
import { applySM2, newSRSState } from '../algorithms/sm2';
import { getWorkingSet, getReviewCards, getMasteredCards } from '../utils/cardUtils';
import { Exercise, buildExerciseForCard } from '../utils/exerciseUtils';
import { GrammarExercise as GrammarExerciseType, buildGrammarExercise } from '../utils/grammarUtils';
import { getAllGrammarForLevels } from '../data/grammar';

type FlashPhase = 'pre-flip' | 'post-flip';

type Phase = 'loading' | 'flashcards' | 'exercises' | 'complete';

interface ExercisesScreenProps {
  onBack: () => void;
}

export default function ExercisesScreen({ onBack }: ExercisesScreenProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();

  const [phase, setPhase] = useState<Phase>('loading');
  const [flashcardQueue, setFlashcardQueue] = useState<VocabCard[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashPhase, setFlashPhase] = useState<FlashPhase>('pre-flip');
  const [pendingRating, setPendingRating] = useState<DifficultyRating | null>(null);
  const [quickSettingsVisible, setQuickSettingsVisible] = useState(false);
  const [missedCards, setMissedCards] = useState<VocabCard[]>([]);

  const [exercises, setExercises] = useState<Array<Exercise | GrammarExerciseType>>([]);
  const [exIndex, setExIndex] = useState(0);
  const [exScore, setExScore] = useState({ correct: 0, total: 0 });

  const [flashStats, setFlashStats] = useState({ completed: 0, total: 0 });

  const load = useCallback(async () => {
    const levels = settings.exerciseLevelFilter ?? settings.activeLevels;
    const allCards: VocabCard[] = [];
    const allIds: string[] = [];
    for (const level of levels) {
      allCards.push(...getCardsForLevel(level));
      allIds.push(...getAllCardIds(level));
    }
    const states = await getAllSRSStates(allIds);

    const working = getWorkingSet(allCards, states, settings.workingSetSize);
    const mastered = getMasteredCards(allCards, states);
    const reviewSample = getReviewCards(mastered, Math.max(1, Math.floor(working.length * 0.15)));
    const queue = [...working, ...reviewSample];

    setFlashcardQueue(queue);
    setFlashStats({ completed: 0, total: queue.length });
    setFlashIndex(0);
    setFlashPhase('pre-flip');
    setPendingRating(null);
    setMissedCards([]);
    setPhase(queue.length > 0 ? 'flashcards' : 'exercises');
  }, [settings.exerciseLevelFilter, settings.activeLevels, settings.workingSetSize]);

  useEffect(() => { load(); }, [load]);

  // Phase 1: Flashcard rating
  const rateFlashcard = useCallback(async (rating: DifficultyRating) => {
    const card = flashcardQueue[flashIndex];
    if (!card) return;

    const states = await getAllSRSStates([card.id]);
    const existing = states[card.id] ?? newSRSState(card.id);
    const isFirstSeen = existing.repetition === 0;
    const newState = applySM2(existing, rating, isFirstSeen);
    await saveSRSState(newState);
    await appendReviewEvent(
      { cardId: card.id, rating, timestamp: Date.now(), responseTimeMs: 0 },
      !states[card.id],
    );

    const missed = rating !== 'known';
    if (missed) {
      setMissedCards(prev => [...prev, card]);
    }

    const nextIndex = flashIndex + 1;
    setFlashStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    setFlashPhase('pre-flip');
    setPendingRating(null);

    if (nextIndex >= flashcardQueue.length) {
      // Move to exercise phase
      buildExercises(missedCards.concat(missed ? [card] : []));
    } else {
      setFlashIndex(nextIndex);
    }
  }, [flashcardQueue, flashIndex, missedCards]);

  const buildExercises = useCallback((cardsToExercise: VocabCard[]) => {
    const levels = settings.exerciseLevelFilter ?? settings.activeLevels;
    const pool: VocabCard[] = levels.flatMap(l => getCardsForLevel(l));
    const contentType = settings.exerciseContentType ?? 'vocabulary';

    const built: Array<Exercise | GrammarExerciseType> = [];

    if (contentType !== 'grammar') {
      for (const card of cardsToExercise) {
        built.push(buildExerciseForCard(card, pool, settings.useTraditional, settings.listenExercisesEnabled));
      }
    }

    if (contentType !== 'vocabulary') {
      // Add grammar exercises (~25% of session or min 2)
      const grammarRules = getAllGrammarForLevels(levels);
      const grammarCount = contentType === 'grammar'
        ? Math.max(cardsToExercise.length, 5)
        : Math.max(2, Math.floor(built.length * 0.25));
      const shuffledRules = grammarRules.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(grammarCount, shuffledRules.length); i++) {
        const ex = buildGrammarExercise(shuffledRules[i]);
        if (ex) built.push(ex);
      }
    }

    if (built.length === 0) {
      setPhase('complete');
      return;
    }
    // Shuffle the combined exercises
    const shuffled = built.slice().sort(() => Math.random() - 0.5);
    setExercises(shuffled);
    setExIndex(0);
    setExScore({ correct: 0, total: shuffled.length });
    setPhase('exercises');
  }, [settings]);

  const handlePreFlipRate = useCallback((rating: DifficultyRating) => {
    setPendingRating(rating);
    setFlashPhase('post-flip');
  }, []);

  const handleContinue = useCallback(() => {
    if (!pendingRating) return;
    rateFlashcard(pendingRating);
  }, [pendingRating, rateFlashcard]);

  const handleMistaken = useCallback(() => {
    if (!pendingRating) return;
    const downgraded: DifficultyRating =
      pendingRating === 'known' ? 'in_progress' :
      pendingRating === 'in_progress' ? 'unknown' : 'unknown';
    rateFlashcard(downgraded);
  }, [pendingRating, rateFlashcard]);

  const handleSwipe = useCallback((rating: DifficultyRating) => {
    rateFlashcard(rating);
  }, [rateFlashcard]);

  const handleExerciseAnswer = useCallback((correct: boolean) => {
    setExScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total,
    }));
    const next = exIndex + 1;
    if (next >= exercises.length) {
      setPhase('complete');
    } else {
      setExIndex(next);
    }
  }, [exIndex, exercises.length]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (phase === 'complete') {
    return (
      <ThemedView style={styles.centered}>
        <SafeAreaView style={styles.completeInner}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonAbs}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.completeEmoji}>🎉</ThemedText>
          <ThemedText type="title" style={styles.completeTitle}>Session Complete!</ThemedText>
          {exercises.length > 0 && (
            <ThemedText type="secondary" style={styles.completeStats}>
              Exercises: {exScore.correct} / {exScore.total} correct
            </ThemedText>
          )}
          <TouchableOpacity
            onPress={onBack}
            style={[styles.doneButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.doneButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'flashcards') {
    const currentCard = flashcardQueue[flashIndex];
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.top}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
              </TouchableOpacity>
              <ThemedText type="secondary" style={styles.phaseLabel}>Phase 1 · Flashcards</ThemedText>
              <TouchableOpacity onPress={() => setQuickSettingsVisible(v => !v)} style={styles.gearButton}>
                <Ionicons name="settings-outline" size={22} color={colors.tint} />
              </TouchableOpacity>
            </View>
            <SessionProgressBar completed={flashStats.completed} total={flashStats.total} />
          </View>
          {quickSettingsVisible && <QuickSettingsPopover onClose={() => setQuickSettingsVisible(false)} />}
          <View style={styles.deckContainer}>
            <SwipeDeck
              onSwipe={handleSwipe}
              isFlipped={flashPhase === 'post-flip'}
              enabled={flashPhase === 'pre-flip'}
            >
              <FlashCard card={currentCard} isFlipped={flashPhase === 'post-flip'} />
            </SwipeDeck>
          </View>
          <View style={styles.bottom}>
            <DifficultyButtons
              onRate={handlePreFlipRate}
              onContinue={handleContinue}
              onMistaken={handleMistaken}
              visible={true}
              mode={flashPhase === 'pre-flip' ? 'pre-flip' : 'post-flip'}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Phase 2: Exercises
  const currentExercise = exercises[exIndex];
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.top}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="secondary" style={styles.phaseLabel}>Phase 2 · Exercises</ThemedText>
          <SessionProgressBar completed={exIndex} total={exercises.length} />
        </View>
        <ExerciseHost
          key={exIndex}
          exercise={currentExercise}
          onAnswer={handleExerciseAnswer}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: { paddingTop: 12, paddingHorizontal: 16, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phaseLabel: { fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  deckContainer: { flex: 1, paddingHorizontal: 20 },
  bottom: { minHeight: 100, justifyContent: 'flex-end', paddingBottom: 8 },
  gearButton: { padding: 4 },
  backText: { fontSize: 18, fontWeight: '600' },
  backButtonAbs: { position: 'absolute', top: 16, left: 16 },
  completeInner: { alignItems: 'center', gap: 12, padding: 32 },
  completeEmoji: { fontSize: 64, textAlign: 'center' },
  completeTitle: { textAlign: 'center', marginTop: 8 },
  completeStats: { textAlign: 'center', fontSize: 18 },
  doneButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

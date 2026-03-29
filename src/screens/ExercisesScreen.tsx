import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/common/ThemedView';
import { ThemedText } from '../components/common/ThemedText';
import { ExerciseHost } from '../components/exercise/ExerciseHost';
import { SessionProgressBar } from '../components/study/SessionProgressBar';
import { FlashCard } from '../components/study/FlashCard';
import { DifficultyButtons } from '../components/study/DifficultyButtons';
import { SwipeDeck } from '../components/study/SwipeDeck';
import { Colors } from '../theme/colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useSettings } from '../hooks/useSettings';
import { VocabCard } from '../types/vocab';
import { DifficultyRating } from '../types/review';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getAllSRSStates, saveSRSState } from '../storage/cardStateStorage';
import { appendReviewEvent } from '../storage/reviewHistoryStorage';
import { applySM2, newSRSState } from '../algorithms/sm2';
import { getWorkingSet, getReviewCards, getMasteredCards } from '../utils/cardUtils';
import { Exercise, buildExerciseForCard } from '../utils/exerciseUtils';

type Phase = 'loading' | 'flashcards' | 'exercises' | 'complete';

interface ExercisesScreenProps {
  onBack: () => void;
}

export default function ExercisesScreen({ onBack }: ExercisesScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { settings } = useSettings();

  const [phase, setPhase] = useState<Phase>('loading');
  const [flashcardQueue, setFlashcardQueue] = useState<VocabCard[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [missedCards, setMissedCards] = useState<VocabCard[]>([]);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exIndex, setExIndex] = useState(0);
  const [exScore, setExScore] = useState({ correct: 0, total: 0 });

  const [flashStats, setFlashStats] = useState({ completed: 0, total: 0 });

  const load = useCallback(async () => {
    const cards = getCardsForLevel(settings.activeLevel);
    const ids = getAllCardIds(settings.activeLevel);
    const states = await getAllSRSStates(ids);

    const working = getWorkingSet(cards, states, settings.workingSetSize);
    const mastered = getMasteredCards(cards, states);
    const reviewSample = getReviewCards(mastered, Math.max(1, Math.floor(working.length * 0.15)));
    const queue = [...working, ...reviewSample];

    setFlashcardQueue(queue);
    setFlashStats({ completed: 0, total: queue.length });
    setFlashIndex(0);
    setIsFlipped(false);
    setMissedCards([]);
    setPhase(queue.length > 0 ? 'flashcards' : 'exercises');
  }, [settings.activeLevel, settings.workingSetSize]);

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

    if (rating !== 'easy') {
      setMissedCards(prev => [...prev, card]);
    }

    const nextIndex = flashIndex + 1;
    setFlashStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    setIsFlipped(false);

    if (nextIndex >= flashcardQueue.length) {
      // Move to exercise phase
      buildExercises(missedCards.concat(rating !== 'easy' ? [card] : []));
    } else {
      setFlashIndex(nextIndex);
    }
  }, [flashcardQueue, flashIndex, missedCards]);

  const buildExercises = useCallback((cardsToExercise: VocabCard[]) => {
    const cards = getCardsForLevel(settings.activeLevel);
    const pool = cards;
    if (cardsToExercise.length === 0) {
      setPhase('complete');
      return;
    }
    const built: Exercise[] = cardsToExercise.flatMap(card => [
      buildExerciseForCard(card, pool, settings.useTraditional, settings.listenExercisesEnabled),
    ]);
    setExercises(built);
    setExIndex(0);
    setExScore({ correct: 0, total: built.length });
    setPhase('exercises');
  }, [settings]);

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
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="secondary" style={styles.phaseLabel}>Phase 1 · Flashcards</ThemedText>
            <SessionProgressBar completed={flashStats.completed} total={flashStats.total} />
          </View>
          <View style={styles.deckContainer}>
            <SwipeDeck
              onSwipe={(r: DifficultyRating) => rateFlashcard(r)}
              isFlipped={isFlipped}
              enabled={isFlipped}
            >
              <FlashCard card={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(f => !f)} />
            </SwipeDeck>
          </View>
          <View style={styles.bottom}>
            {!isFlipped && (
              <ThemedText type="secondary" style={styles.swipeHint}>
                Swipe ← Don't Know · Swipe → Know
              </ThemedText>
            )}
            <DifficultyButtons onRate={rateFlashcard} visible={isFlipped} mode="flashcard" />
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
  phaseLabel: { fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  deckContainer: { flex: 1, paddingHorizontal: 20 },
  bottom: { minHeight: 100, justifyContent: 'flex-end', paddingBottom: 8 },
  swipeHint: { textAlign: 'center', fontSize: 12, paddingHorizontal: 20, marginBottom: 8 },
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

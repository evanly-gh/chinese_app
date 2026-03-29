import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { FlashCard } from '../../components/study/FlashCard';
import { DifficultyButtons } from '../../components/study/DifficultyButtons';
import { SwipeDeck } from '../../components/study/SwipeDeck';
import { SessionProgressBar } from '../../components/study/SessionProgressBar';
import { useStudySession } from '../../hooks/useStudySession';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { DifficultyRating } from '../../types/review';

export default function StudyScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const {
    currentCard,
    stats,
    isFlipped,
    loading,
    sessionComplete,
    flipCard,
    rateCard,
    resetSession,
  } = useStudySession();

  const handleSwipe = (rating: DifficultyRating) => {
    rateCard(rating);
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (sessionComplete) {
    return (
      <ThemedView style={styles.centered}>
        <SafeAreaView>
          <ThemedText style={styles.completeEmoji}>🎉</ThemedText>
          <ThemedText type="title" style={styles.completeTitle}>Session Complete!</ThemedText>
          <ThemedText type="secondary" style={styles.completeStats}>
            {stats.correct} / {stats.total} correct
          </ThemedText>
          <TouchableOpacity
            onPress={resetSession}
            style={[styles.resetButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.resetButtonText}>Study More</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!currentCard) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="secondary">No cards due today.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.top}>
          <SessionProgressBar completed={stats.completed} total={stats.total} />
        </View>
        <View style={styles.deckContainer}>
          <SwipeDeck
            onSwipe={handleSwipe}
            isFlipped={isFlipped}
            enabled={isFlipped}
          >
            <FlashCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={flipCard}
            />
          </SwipeDeck>
        </View>
        <View style={styles.bottom}>
          {!isFlipped && (
            <ThemedText type="secondary" style={styles.swipeHint}>
              Swipe ← Again · Swipe → Easy · Tap for more options
            </ThemedText>
          )}
          <DifficultyButtons onRate={rateCard} visible={isFlipped} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: 12 },
  top: { paddingTop: 12 },
  deckContainer: { flex: 1, paddingHorizontal: 20 },
  bottom: { minHeight: 100, justifyContent: 'flex-end', paddingBottom: 8 },
  swipeHint: { textAlign: 'center', fontSize: 12, paddingHorizontal: 20, marginBottom: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  completeEmoji: { fontSize: 64, textAlign: 'center' },
  completeTitle: { textAlign: 'center', marginTop: 8 },
  completeStats: { textAlign: 'center', fontSize: 18, marginTop: 4 },
  resetButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { FlashCard } from '../../components/study/FlashCard';
import { DifficultyButtons } from '../../components/study/DifficultyButtons';
import { SwipeDeck } from '../../components/study/SwipeDeck';
import { SessionProgressBar } from '../../components/study/SessionProgressBar';
import { SessionConfigModal } from '../../components/study/SessionConfigModal';
import { QuickSettingsPopover } from '../../components/common/QuickSettingsPopover';
import { useTheme } from '../../hooks/useTheme';
import { useStudySession } from '../../hooks/useStudySession';
import { useSettings } from '../../hooks/useSettings';
import { DifficultyRating } from '../../types/review';
import { FlashcardSessionConfig } from '../../types/settings';
import { getCardsForLevel, getAllCardIds } from '../../data';
import { getAllSRSStates } from '../../storage/cardStateStorage';
import { getMasteredCards, getWorkingSet } from '../../utils/cardUtils';
import { getLastTestResult } from '../../storage/testResultStorage';
import ExercisesScreen from '../../screens/ExercisesScreen';
import TestScreen from '../../screens/TestScreen';

type FlashPhase = 'pre-flip' | 'post-flip';

type StudyMode = 'picker' | 'flashcards' | 'exercises' | 'test';

// ─── Mode Picker ────────────────────────────────────────────────────────────

interface ModeCardData {
  title: string;
  subtitle: string;
  icon: string;
  mode: Exclude<StudyMode, 'picker'>;
  color: string;
}

function ModePickerScreen({
  onSelect,
}: {
  onSelect: (mode: Exclude<StudyMode, 'picker'>) => void;
}) {
  const { scheme, colors } = useTheme();
  const { settings } = useSettings();
  const [workingInfo, setWorkingInfo] = useState<{ working: number; mastered: number } | null>(null);
  const [lastTest, setLastTest] = useState<{ score: number; total: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const cards = getCardsForLevel(settings.activeLevel);
        const ids = getAllCardIds(settings.activeLevel);
        const states = await getAllSRSStates(ids);
        if (!active) return;
        const mastered = getMasteredCards(cards, states).length;
        const working = getWorkingSet(cards, states, settings.workingSetSize).length;
        setWorkingInfo({ working, mastered });

        const last = await getLastTestResult(settings.activeLevel);
        if (last) setLastTest({ score: last.score, total: last.total });
      })();
      return () => { active = false; };
    }, [settings.activeLevel, settings.workingSetSize]),
  );

  const modes: ModeCardData[] = [
    {
      title: 'Flashcards',
      subtitle: workingInfo
        ? `${workingInfo.working} in working set · ${workingInfo.mastered} mastered`
        : 'Tap-to-flip spaced repetition',
      icon: '🃏',
      mode: 'flashcards',
      color: colors.tint,
    },
    {
      title: 'Exercises',
      subtitle: 'Translation, fill-in-the-blank, bubble reorder & listening',
      icon: '✏️',
      mode: 'exercises',
      color: colors.good,
    },
    {
      title: 'Test',
      subtitle: lastTest
        ? `Last score: ${lastTest.score}/${lastTest.total}`
        : 'Full HSK level assessment',
      icon: '📝',
      mode: 'test',
      color: colors.hard,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.pickerContent}>
          <ThemedText type="title" style={styles.pickerTitle}>Study</ThemedText>
          <ThemedText type="secondary" style={styles.pickerSubtitle}>
            HSK {settings.activeLevel}
          </ThemedText>
          {modes.map(m => (
            <TouchableOpacity
              key={m.mode}
              onPress={() => onSelect(m.mode)}
              style={[styles.modeCard, { borderLeftColor: m.color, borderLeftWidth: 4 }]}
              activeOpacity={0.8}
            >
              <ThemedView variant="card" style={styles.modeCardInner}>
                <ThemedText style={styles.modeIcon}>{m.icon}</ThemedText>
                <View style={styles.modeText}>
                  <ThemedText style={styles.modeTitle}>{m.title}</ThemedText>
                  <ThemedText type="secondary" style={styles.modeSubtitle}>{m.subtitle}</ThemedText>
                </View>
                <ThemedText style={[styles.modeArrow, { color: m.color }]}>›</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Flashcard Mode ──────────────────────────────────────────────────────────

function FlashcardMode({ onBack }: { onBack: () => void }) {
  const { scheme, colors } = useTheme();
  const { settings, updateSetting } = useSettings();
  const [configVisible, setConfigVisible] = useState(true);
  const [sessionConfig, setSessionConfig] = useState<FlashcardSessionConfig>(
    settings.flashcardConfig,
  );
  const [sessionKey, setSessionKey] = useState(0);
  const [flashPhase, setFlashPhase] = useState<FlashPhase>('pre-flip');
  const [pendingRating, setPendingRating] = useState<DifficultyRating | null>(null);
  const [quickSettingsVisible, setQuickSettingsVisible] = useState(false);

  const {
    currentCard,
    stats,
    loading,
    sessionComplete,
    flipCard,
    rateCard,
    resetSession,
  } = useStudySession(sessionConfig, sessionKey);

  useEffect(() => {
    setFlashPhase('pre-flip');
    setPendingRating(null);
  }, [currentCard?.id]);

  const handleConfigStart = useCallback(
    (cfg: FlashcardSessionConfig) => {
      updateSetting('flashcardConfig', cfg);
      setSessionConfig(cfg);
      setConfigVisible(false);
      setSessionKey(k => k + 1);
    },
    [updateSetting],
  );

  const handlePreFlipRate = useCallback((rating: DifficultyRating) => {
    setPendingRating(rating);
    setFlashPhase('post-flip');
    flipCard();
  }, [flipCard]);

  const handleContinue = useCallback(() => {
    if (!pendingRating) return;
    rateCard(pendingRating);
    setFlashPhase('pre-flip');
    setPendingRating(null);
  }, [pendingRating, rateCard]);

  const handleMistaken = useCallback(() => {
    if (!pendingRating) return;
    const downgraded: DifficultyRating =
      pendingRating === 'known' ? 'in_progress' :
      pendingRating === 'in_progress' ? 'unknown' : 'unknown';
    rateCard(downgraded);
    setFlashPhase('pre-flip');
    setPendingRating(null);
  }, [pendingRating, rateCard]);

  const handleSwipe = useCallback((rating: DifficultyRating) => {
    rateCard(rating);
    setFlashPhase('pre-flip');
    setPendingRating(null);
  }, [rateCard]);

  if (configVisible) {
    return (
      <>
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
            </TouchableOpacity>
          </SafeAreaView>
        </ThemedView>
        <SessionConfigModal
          visible
          config={sessionConfig}
          onStart={handleConfigStart}
          onDismiss={onBack}
        />
      </>
    );
  }

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
          <TouchableOpacity onPress={onBack} style={styles.backButtonAbs}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.completeEmoji}>🎉</ThemedText>
          <ThemedText type="title" style={styles.completeTitle}>Session Complete!</ThemedText>
          <ThemedText type="secondary" style={styles.completeStats}>
            {stats.correct} / {stats.total} correct
          </ThemedText>
          <TouchableOpacity
            onPress={() => { resetSession(); }}
            style={[styles.resetButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.resetButtonText}>Study More</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setConfigVisible(true); }}
            style={[styles.resetButton, { backgroundColor: colors.border, marginTop: 10 }]}
          >
            <ThemedText style={styles.resetButtonText}>Change Settings</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!currentCard) {
    return (
      <ThemedView style={styles.centered}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonAbs}>
          <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="secondary">No cards due for this configuration.</ThemedText>
        <TouchableOpacity
          onPress={() => setConfigVisible(true)}
          style={[styles.resetButton, { backgroundColor: colors.tint, marginTop: 16 }]}
        >
          <ThemedText style={styles.resetButtonText}>Change Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.top}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>‹ Back</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQuickSettingsVisible(v => !v)} style={styles.gearButton}>
              <Ionicons name="settings-outline" size={22} color={colors.tint} />
            </TouchableOpacity>
          </View>
          <SessionProgressBar completed={stats.completed} total={stats.total} />
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

// ─── Root Study Tab ──────────────────────────────────────────────────────────

export default function StudyTab() {
  const [mode, setMode] = useState<StudyMode>('picker');

  if (mode === 'flashcards') {
    return <FlashcardMode onBack={() => setMode('picker')} />;
  }
  if (mode === 'exercises') {
    return <ExercisesScreen onBack={() => setMode('picker')} />;
  }
  if (mode === 'test') {
    return <TestScreen onBack={() => setMode('picker')} />;
  }

  return <ModePickerScreen onSelect={setMode} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  // Picker
  pickerContent: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  pickerTitle: { fontSize: 28, marginBottom: 2 },
  pickerSubtitle: { fontSize: 16, marginBottom: 8 },
  modeCard: { borderRadius: 16, overflow: 'hidden' },
  modeCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  modeIcon: { fontSize: 32 },
  modeText: { flex: 1, gap: 3 },
  modeTitle: { fontSize: 18, fontWeight: '700' },
  modeSubtitle: { fontSize: 13 },
  modeArrow: { fontSize: 28, fontWeight: '300' },

  // Flashcard layout
  top: { paddingTop: 12, paddingHorizontal: 16, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deckContainer: { flex: 1, paddingHorizontal: 20 },
  bottom: { minHeight: 100, justifyContent: 'flex-end', paddingBottom: 8 },
  gearButton: { padding: 4 },

  // Back button
  backButton: { padding: 16 },
  backButtonAbs: { position: 'absolute', top: 16, left: 16 },
  backText: { fontSize: 18, fontWeight: '600' },

  // Complete screen
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

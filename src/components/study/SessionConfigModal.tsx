import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { FlashcardSessionConfig, FlashcardSortMode } from '../../types/settings';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { getCardsForLevel } from '../../data';

interface SessionConfigModalProps {
  visible: boolean;
  config: FlashcardSessionConfig;
  onStart: (config: FlashcardSessionConfig) => void;
  onDismiss: () => void;
}

const SESSION_SIZES = [5, 10, 20, 30, 50];

const SORT_MODES: { mode: FlashcardSortMode; label: string; description: string }[] = [
  { mode: 'due-first', label: 'Due First', description: 'SRS cards due today, then new cards' },
  { mode: 'familiarity', label: 'Least Familiar', description: 'Cards you have practiced least' },
  { mode: 'difficulty', label: 'Hardest First', description: 'Cards with lowest ease factor' },
  { mode: 'random', label: 'Random', description: 'Shuffled order' },
  { mode: 'sequential', label: 'Sequential', description: 'Curriculum order from the database' },
];

const AVAILABLE_LEVELS = [1, 2, 3, 4, 5];

export function SessionConfigModal({
  visible,
  config,
  onStart,
  onDismiss,
}: SessionConfigModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [draft, setDraft] = useState<FlashcardSessionConfig>(config);

  const toggleLevel = (level: number) => {
    const hasCards = getCardsForLevel(level).length > 0;
    if (!hasCards) return;
    setDraft(prev => {
      const already = prev.levelFilter.includes(level);
      if (already && prev.levelFilter.length === 1) return prev; // keep at least one
      return {
        ...prev,
        levelFilter: already
          ? prev.levelFilter.filter(l => l !== level)
          : [...prev.levelFilter, level],
      };
    });
  };

  const handleStart = () => {
    onStart(draft);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.title}>Session Settings</ThemedText>

            {/* Session Size */}
            <ThemedText style={styles.label}>Cards per Session</ThemedText>
            <View style={styles.row}>
              {SESSION_SIZES.map(size => {
                const active = draft.sessionSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setDraft(prev => ({ ...prev, sessionSize: size }))}
                    style={[
                      styles.chip,
                      { borderColor: active ? colors.tint : colors.border },
                      active && { backgroundColor: colors.tint },
                    ]}
                  >
                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                      {size}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Level Filter */}
            <ThemedText style={styles.label}>HSK Levels</ThemedText>
            <View style={styles.row}>
              {AVAILABLE_LEVELS.map(level => {
                const hasCards = getCardsForLevel(level).length > 0;
                const active = draft.levelFilter.includes(level);
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => toggleLevel(level)}
                    disabled={!hasCards}
                    style={[
                      styles.levelChip,
                      { borderColor: active ? colors.tint : colors.border },
                      active && { backgroundColor: colors.tint },
                      !hasCards && styles.disabled,
                    ]}
                  >
                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                      {level}
                    </ThemedText>
                    {!hasCards && (
                      <ThemedText style={[styles.soonText, { color: colors.textSecondary }]}>
                        Soon
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort Mode */}
            <ThemedText style={styles.label}>Sort Order</ThemedText>
            {SORT_MODES.map(({ mode, label, description }) => {
              const active = draft.sortMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setDraft(prev => ({ ...prev, sortMode: mode }))}
                  style={[
                    styles.sortOption,
                    { borderColor: active ? colors.tint : colors.border },
                    active && { backgroundColor: colors.tint + '18' },
                  ]}
                >
                  <View style={styles.sortLeft}>
                    <ThemedText style={[styles.sortLabel, active && { color: colors.tint }]}>
                      {label}
                    </ThemedText>
                    <ThemedText type="secondary" style={styles.sortDesc}>{description}</ThemedText>
                  </View>
                  {active && (
                    <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={handleStart}
              style={[styles.startButton, { backgroundColor: colors.tint }]}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.startButtonText}>Start Session</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000060',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  levelChip: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  soonText: {
    fontSize: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sortLeft: {
    flex: 1,
    gap: 2,
  },
  sortLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sortDesc: {
    fontSize: 13,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  startButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

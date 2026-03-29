import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../common/ThemedText';
import { VocabCard } from '../../types/vocab';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';

interface CardFrontProps {
  card: VocabCard;
}

export function CardFront({ card }: CardFrontProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { settings } = useSettings();
  const { speak } = useTTS();

  const hanzi = settings.useTraditional ? card.traditional : card.simplified;

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <ThemedText type="caption" style={{ color: colors.tint }}>HSK {card.level}</ThemedText>
      </View>
      <ThemedText style={styles.character}>{hanzi}</ThemedText>
      {settings.showPinyin && (
        <ThemedText style={[styles.pinyin, { color: colors.textSecondary }]}>{card.pinyin}</ThemedText>
      )}
      <ThemedText type="secondary" style={styles.hint}>tap to reveal</ThemedText>
      <TouchableOpacity
        onPress={() => speak(hanzi)}
        style={[styles.ttsButton, { backgroundColor: colors.border }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="volume-high-outline" size={22} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  levelBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  character: {
    fontSize: 80,
    lineHeight: 96,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 4,
  },
  pinyin: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: '400',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
  },
  ttsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

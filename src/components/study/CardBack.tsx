import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../common/ThemedText';
import { VocabCard } from '../../types/vocab';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';

interface CardBackProps {
  card: VocabCard;
}

export function CardBack({ card }: CardBackProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { settings } = useSettings();
  const { speak } = useTTS();

  const hanzi = settings.useTraditional ? card.traditional : card.simplified;
  const example = settings.useTraditional ? card.exampleTraditional : card.exampleSimplified;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.character, { color: colors.tint }]}>{hanzi}</ThemedText>
      {settings.showPinyin && (
        <ThemedText style={styles.pinyin}>{card.pinyin}</ThemedText>
      )}
      <ThemedText style={styles.english}>{card.english}</ThemedText>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.exampleContainer}>
        <ThemedText style={styles.exampleChinese}>{example}</ThemedText>
        {settings.showPinyin && (
          <ThemedText style={styles.examplePinyin}>{card.examplePinyin}</ThemedText>
        )}
        <ThemedText type="secondary" style={styles.exampleEnglish}>{card.exampleEnglish}</ThemedText>
      </View>
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
  character: {
    fontSize: 48,
    fontWeight: '400',
    textAlign: 'center',
  },
  pinyin: {
    fontSize: 22,
    marginTop: 8,
    fontWeight: '500',
  },
  english: {
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '80%',
    marginVertical: 20,
  },
  exampleContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  exampleChinese: {
    fontSize: 18,
    textAlign: 'center',
  },
  examplePinyin: {
    fontSize: 14,
    textAlign: 'center',
  },
  exampleEnglish: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
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

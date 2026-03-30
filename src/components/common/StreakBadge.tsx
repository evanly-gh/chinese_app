import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '../../hooks/useTheme';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={28} color="#FF6D00" />
      <ThemedText style={styles.count}>{streak}</ThemedText>
      <ThemedText type="secondary" style={styles.label}>day streak</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 24, fontWeight: '700' },
  label: { fontSize: 14, marginTop: 2 },
});

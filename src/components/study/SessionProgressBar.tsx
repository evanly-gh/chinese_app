import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar } from '../common/ProgressBar';
import { ThemedText } from '../common/ThemedText';

interface SessionProgressBarProps {
  completed: number;
  total: number;
}

export function SessionProgressBar({ completed, total }: SessionProgressBarProps) {
  const progress = total > 0 ? completed / total : 0;
  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} height={6} />
      <ThemedText type="secondary" style={styles.label}>{completed} / {total}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 4 },
  label: { textAlign: 'right', fontSize: 12 },
});

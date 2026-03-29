import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useProgress } from '../../hooks/useProgress';
import { useSettings } from '../../hooks/useSettings';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { data, loading, reload } = useProgress();
  const { settings } = useSettings();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!data) return null;

  const maxCount = Math.max(...data.dailyPoints.map(p => p.count), 1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.pageTitle}>Progress</ThemedText>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.streak}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Day Streak</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.todayCount}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Today</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.mastered}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Mastered</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.completionPct}%</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>HSK {settings.activeLevel}</ThemedText>
            </ThemedView>
          </View>

          {/* Daily chart (simple bar chart without victory-native-xl dependency) */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.cardTitle}>Cards Reviewed (14 days)</ThemedText>
            <View style={styles.chartContainer}>
              {data.dailyPoints.slice(-14).map((point, i) => (
                <View key={point.date} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (point.count / maxCount) * 120),
                          backgroundColor: point.count > 0 ? colors.tint : colors.border,
                        },
                      ]}
                    />
                  </View>
                  {i % 3 === 0 && (
                    <ThemedText type="secondary" style={styles.barLabel}>{point.label}</ThemedText>
                  )}
                </View>
              ))}
            </View>
          </ThemedView>

          {/* Level completion */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.cardTitle}>HSK {settings.activeLevel} Progress</ThemedText>
            <View style={styles.cardRow}>
              <ThemedText type="secondary">{data.learned} of {data.total} words learned</ThemedText>
              <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>{data.completionPct}%</ThemedText>
            </View>
            <ProgressBar progress={data.completionPct / 100} height={12} />
          </ThemedView>

          {/* Weak cards */}
          {data.weakCards.length > 0 && (
            <ThemedView variant="card" style={styles.card}>
              <ThemedText style={styles.cardTitle}>Weakest Cards</ThemedText>
              {data.weakCards.slice(0, 10).map(card => (
                <View key={card.id} style={[styles.weakCard, { borderBottomColor: colors.border }]}>
                  <ThemedText style={styles.weakHanzi}>{card.simplified}</ThemedText>
                  <ThemedText type="secondary" style={styles.weakPinyin}>{card.pinyin}</ThemedText>
                  {card.lapses > 0 && (
                    <View style={[styles.efBadge, { backgroundColor: colors.hard + '20', marginRight: 4 }]}>
                      <ThemedText style={[styles.efText, { color: colors.hard }]}>
                        {card.lapses}✗
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.efBadge, { backgroundColor: colors.again + '20' }]}>
                    <ThemedText style={[styles.efText, { color: colors.again }]}>
                      {card.efactor.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 16 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  card: { borderRadius: 16, padding: 20, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 2 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '80%', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, textAlign: 'center' },
  weakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  weakHanzi: { fontSize: 22, width: 48 },
  weakPinyin: { flex: 1, fontSize: 14 },
  efBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  efText: { fontSize: 12, fontWeight: '700' },
});

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { StreakBadge } from '../../components/common/StreakBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useStreak } from '../../hooks/useStreak';
import { useProgress } from '../../hooks/useProgress';
import { useSettings } from '../../hooks/useSettings';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { streak } = useStreak();
  const { data } = useProgress();
  const { settings } = useSettings();

  const todayProgress = data ? data.todayCount / settings.dailyGoal : 0;
  const goalMet = data ? data.todayCount >= settings.dailyGoal : false;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="secondary" style={styles.greeting}>Learning</ThemedText>
              <ThemedText type="title" style={styles.title}>HSK {settings.activeLevel}</ThemedText>
            </View>
            <StreakBadge streak={streak} />
          </View>

          {/* Daily Goal Card */}
          <ThemedView variant="card" style={[styles.card, { shadowColor: colors.cardShadow }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Today's Goal</ThemedText>
              <ThemedText style={[styles.cardCount, { color: colors.tint }]}>
                {data?.todayCount ?? 0} / {settings.dailyGoal}
              </ThemedText>
            </View>
            <ProgressBar progress={Math.min(todayProgress, 1)} height={10} />
            {goalMet && (
              <ThemedText style={[styles.goalComplete, { color: colors.easy }]}>
                🎉 Daily goal complete!
              </ThemedText>
            )}
          </ThemedView>

          {/* Level Progress Card */}
          {data && (
            <ThemedView variant="card" style={styles.card}>
              <ThemedText style={styles.cardTitle}>Level Progress</ThemedText>
              <View style={styles.cardRow}>
                <ThemedText type="secondary">HSK {settings.activeLevel} words learned</ThemedText>
                <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
                  {data.completionPct}%
                </ThemedText>
              </View>
              <ProgressBar progress={data.completionPct / 100} height={8} />
              <ThemedText type="secondary" style={styles.cardSubtext}>
                {data.learned} / {data.total} words
              </ThemedText>
            </ThemedView>
          )}

          {/* Study Now Button */}
          <TouchableOpacity
            onPress={() => router.push('/study')}
            style={[
              styles.studyButton,
              { backgroundColor: goalMet ? colors.border : colors.tint },
            ]}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.studyButtonText}>
              {goalMet ? 'Keep Studying' : 'Study Now'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: { fontSize: 14 },
  title: { fontSize: 28 },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardCount: { fontSize: 18, fontWeight: '700' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSubtext: { fontSize: 13, marginTop: -4 },
  goalComplete: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  studyButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

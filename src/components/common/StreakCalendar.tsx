import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useTheme } from '../../hooks/useTheme';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface StreakCalendarProps {
  goalMetDays: string[];  // ISO date strings where goal was met
  streak: number;
  dailyGoal: number;
}

export function StreakCalendar({ goalMetDays, streak, dailyGoal }: StreakCalendarProps) {
  const { colors } = useTheme();

  // Build last 28 days array
  const days: { date: string; goalMet: boolean; isToday: boolean; dayOfWeek: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      goalMet: goalMetDays.includes(dateStr),
      isToday: i === 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Pad at the start to align with Sunday
  const firstDayOfWeek = days[0].dayOfWeek;
  const padded = Array(firstDayOfWeek).fill(null).concat(days);

  // Split into weeks
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <ThemedView variant="card" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Activity</ThemedText>
        <ThemedText style={[styles.streakText, { color: colors.tint }]}>
          🔥 {streak} day streak
        </ThemedText>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <ThemedText key={i} type="secondary" style={styles.dayLabel}>{d}</ThemedText>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.dayCell} />;
            return (
              <View key={di} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayDot,
                    day.goalMet
                      ? { backgroundColor: colors.tint }
                      : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
                    day.isToday && !day.goalMet && { borderColor: colors.tint, borderWidth: 2 },
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}

      <ThemedText type="secondary" style={styles.goalHint}>
        Goal: {dailyGoal} cards/day
      </ThemedText>
    </ThemedView>
  );
}

const DOT_SIZE = 28;
const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  streakText: { fontSize: 15, fontWeight: '700' },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayLabel: { width: DOT_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  week: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayCell: { width: DOT_SIZE, alignItems: 'center' },
  dayDot: { width: DOT_SIZE - 4, height: DOT_SIZE - 4, borderRadius: (DOT_SIZE - 4) / 2 },
  goalHint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});

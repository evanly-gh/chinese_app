import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useTheme } from '../../hooks/useTheme';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface StreakCalendarProps {
  goalMetDays: string[];  // ISO date strings where goal was met
  streak: number;
  dailyGoal: number;
}

export function StreakCalendar({ goalMetDays, streak, dailyGoal }: StreakCalendarProps) {
  const { colors } = useTheme();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Build all days of the current month
  const days: { date: string; goalMet: boolean; isToday: boolean; dayOfWeek: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dateStr = dt.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      goalMet: goalMetDays.includes(dateStr),
      isToday: d === todayDate,
      dayOfWeek: dt.getDay(),
    });
  }

  // Pad start to align first day to correct weekday column
  const padded: (typeof days[0] | null)[] = Array(firstDayOfWeek).fill(null).concat(days);

  // Split into weeks of 7
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    // Pad last week to exactly 7 cells
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <ThemedView variant="card" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{MONTH_NAMES[month]} {year}</ThemedText>
        <ThemedText style={[styles.streakText, { color: colors.tint }]}>
          🔥 {streak} day streak
        </ThemedText>
      </View>

      {/* Day labels */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((d, i) => (
          <ThemedText key={i} type="secondary" style={styles.dayLabel}>{d}</ThemedText>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
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
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { width: DOT_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  dayCell: { width: DOT_SIZE, alignItems: 'center' },
  dayDot: { width: DOT_SIZE - 4, height: DOT_SIZE - 4, borderRadius: (DOT_SIZE - 4) / 2 },
  goalHint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});

import { useState, useEffect, useCallback } from 'react';
import { getLast14DaysLogs, getStreak } from '../storage/reviewHistoryStorage';
import { getAllSRSStates } from '../storage/cardStateStorage';
import { getLevelStats, getWeakCards } from '../utils/cardUtils';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getSettings } from '../storage/settingsStorage';
import { DailyLog } from '../types/review';
import { VocabCard } from '../types/vocab';
import { formatShortDate } from '../utils/dateUtils';

export interface DailyChartPoint {
  date: string;
  label: string;
  count: number;
}

export interface ProgressData {
  dailyPoints: DailyChartPoint[];
  learned: number;
  total: number;
  mastered: number;
  completionPct: number;
  masteredPct: number;
  streak: number;
  todayCount: number;
  dailyGoal: number;
  weakCards: Array<VocabCard & { efactor: number; lapses: number }>;
}

export function useProgress(): { data: ProgressData | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const settings = await getSettings();
    const level = settings.activeLevel;
    const cardIds = getAllCardIds(level);
    const cards = getCardsForLevel(level);
    const [logs, states, streakData] = await Promise.all([
      getLast14DaysLogs(),
      getAllSRSStates(cardIds),
      getStreak(),
    ]);

    const dailyPoints: DailyChartPoint[] = logs.map((log: DailyLog) => ({
      date: log.date,
      label: formatShortDate(log.date),
      count: log.reviewedCards,
    }));

    const { learned, total, mastered } = getLevelStats(cards, states);
    const todayLog = logs[logs.length - 1];
    const todayCount = todayLog?.reviewedCards ?? 0;

    setData({
      dailyPoints,
      learned,
      total,
      mastered,
      completionPct: total > 0 ? Math.round((learned / total) * 100) : 0,
      masteredPct: total > 0 ? Math.round((mastered / total) * 100) : 0,
      streak: streakData.current,
      todayCount,
      dailyGoal: settings.dailyGoal,
      weakCards: getWeakCards(cards, states),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}

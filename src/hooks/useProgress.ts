import { useState, useEffect } from 'react';
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
  completionPct: number;
  streak: number;
  todayCount: number;
  dailyGoal: number;
  weakCards: Array<VocabCard & { efactor: number }>;
}

export function useProgress(): { data: ProgressData | null; loading: boolean } {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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

      const { learned, total } = getLevelStats(cards, states);
      const todayLog = logs[logs.length - 1];
      const todayCount = todayLog?.reviewedCards ?? 0;

      setData({
        dailyPoints,
        learned,
        total,
        completionPct: total > 0 ? Math.round((learned / total) * 100) : 0,
        streak: streakData.current,
        todayCount,
        dailyGoal: settings.dailyGoal,
        weakCards: getWeakCards(cards, states),
      });
      setLoading(false);
    }
    load();
  }, []);

  return { data, loading };
}

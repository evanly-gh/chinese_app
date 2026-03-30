import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, ReviewEvent } from '../types/review';
import { last14Days, last28Days, today } from '../utils/dateUtils';
import { KEYS } from './keys';

function logKey(date: string): string {
  return KEYS.DAILY_LOG_PREFIX + date;
}

export async function getDailyLog(date: string): Promise<DailyLog> {
  const raw = await AsyncStorage.getItem(logKey(date));
  if (raw) return JSON.parse(raw) as DailyLog;
  return { date, newCards: 0, reviewedCards: 0, events: [] };
}

export async function appendReviewEvent(
  event: ReviewEvent,
  isNewCard: boolean,
): Promise<void> {
  const log = await getDailyLog(today());
  log.events.push(event);
  log.reviewedCards += 1;
  if (isNewCard) log.newCards += 1;
  await AsyncStorage.setItem(logKey(today()), JSON.stringify(log));
}

export async function getLast14DaysLogs(): Promise<DailyLog[]> {
  const dates = last14Days();
  const keys = dates.map(logKey);
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.map(([key, value], i) => {
    if (value) return JSON.parse(value) as DailyLog;
    return { date: dates[i], newCards: 0, reviewedCards: 0, events: [] };
  });
}

export async function getLast28DaysLogs(): Promise<DailyLog[]> {
  const dates = last28Days();
  const keys = dates.map(logKey);
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.map(([key, value], i) => {
    if (value) return JSON.parse(value) as DailyLog;
    return { date: dates[i], newCards: 0, reviewedCards: 0, events: [] };
  });
}

export function getLast28DaysList(): string[] {
  return last28Days();
}

export interface StreakData {
  current: number;
  lastDate: string;
}

export async function getStreak(): Promise<StreakData> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  if (raw) return JSON.parse(raw) as StreakData;
  return { current: 0, lastDate: '' };
}

export async function updateStreak(): Promise<StreakData> {
  const { current, lastDate } = await getStreak();
  const t = today();
  if (lastDate === t) return { current, lastDate };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const newStreak = lastDate === yesterdayStr ? current + 1 : 1;
  const data: StreakData = { current: newStreak, lastDate: t };
  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(data));
  return data;
}

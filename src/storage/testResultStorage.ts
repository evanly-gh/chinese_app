import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './keys';

export interface TestResult {
  date: string;
  level: number;
  score: number;
  total: number;
  incorrect: string[]; // cardIds
}

export async function saveTestResult(result: TestResult): Promise<void> {
  const existing = await getTestResults();
  existing.push(result);
  // Keep last 50 results
  const trimmed = existing.slice(-50);
  await AsyncStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(trimmed));
}

export async function getTestResults(): Promise<TestResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TEST_RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getLastTestResult(level: number): Promise<TestResult | null> {
  const all = await getTestResults();
  const forLevel = all.filter(r => r.level === level);
  return forLevel.length > 0 ? forLevel[forLevel.length - 1] : null;
}

/**
 * cloudSync.ts
 *
 * Thin wrapper around Supabase for syncing user data.
 * Strategy: pull everything on login, push after each session/settings change.
 * AsyncStorage remains the local cache; Supabase is the source of truth.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { SRSState } from '../types/vocab';
import { DailyLog } from '../types/review';
import { AppSettings } from '../types/settings';
import { TestResult } from './testResultStorage';
import { KEYS } from './keys';
import { last14Days } from '../utils/dateUtils';

// ── Pull (cloud → local) ──────────────────────────────────────────────────────

export async function pullAll(userId: string): Promise<void> {
  await Promise.all([
    pullSRSStates(userId),
    pullReviewLogs(userId),
    pullSettings(userId),
    pullTestResults(userId),
  ]);
}

async function pullSRSStates(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('srs_states')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return;

  const pairs: [string, string][] = data.map(row => [
    KEYS.SRS_PREFIX + row.card_id,
    JSON.stringify({
      cardId: row.card_id,
      interval: row.interval,
      repetition: row.repetition,
      efactor: row.efactor,
      dueDate: row.due_date,
      firstSeenDate: row.first_seen_date,
      lastReviewDate: row.last_review_date,
      lapses: row.lapses,
    } satisfies SRSState),
  ]);
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
}

async function pullReviewLogs(userId: string): Promise<void> {
  const dates = last14Days();
  const { data, error } = await supabase
    .from('review_logs')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates);
  if (error || !data) return;

  const pairs: [string, string][] = data.map(row => [
    KEYS.DAILY_LOG_PREFIX + row.date,
    JSON.stringify({
      date: row.date,
      newCards: row.new_cards,
      reviewedCards: row.reviewed_cards,
      events: row.events ?? [],
    } satisfies DailyLog),
  ]);
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
}

async function pullSettings(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();
  if (error || !data) return;
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
}

async function pullTestResults(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: true });
  if (error || !data) return;

  const results: TestResult[] = data.map(row => ({
    date: (row.taken_at as string).slice(0, 10),
    level: row.level as number,
    score: row.score as number,
    total: (row.total as number) ?? 0,
    incorrect: (row.incorrect as string[]) ?? [],
  }));
  await AsyncStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(results));
}

// ── Push (local → cloud) ──────────────────────────────────────────────────────

export async function pushSRSStates(
  userId: string,
  states: SRSState[],
): Promise<void> {
  if (states.length === 0) return;
  const rows = states.map(s => ({
    user_id: userId,
    card_id: s.cardId,
    interval: s.interval,
    repetition: s.repetition,
    efactor: s.efactor,
    due_date: s.dueDate,
    first_seen_date: s.firstSeenDate,
    last_review_date: s.lastReviewDate,
    lapses: s.lapses,
  }));
  await supabase.from('srs_states').upsert(rows, { onConflict: 'user_id,card_id' });
}

export async function pushDailyLog(
  userId: string,
  log: DailyLog,
): Promise<void> {
  await supabase.from('review_logs').upsert(
    {
      user_id: userId,
      date: log.date,
      new_cards: log.newCards,
      reviewed_cards: log.reviewedCards,
      events: log.events,
    },
    { onConflict: 'user_id,date' },
  );
}

export async function pushSettings(
  userId: string,
  settings: AppSettings,
): Promise<void> {
  await supabase.from('user_settings').upsert(
    { user_id: userId, settings },
    { onConflict: 'user_id' },
  );
}

export async function pushTestResult(
  userId: string,
  result: TestResult,
): Promise<void> {
  await supabase.from('test_results').insert({
    user_id: userId,
    level: result.level,
    score: result.score,
    total: result.total,
    incorrect: result.incorrect ?? [],
  });
}

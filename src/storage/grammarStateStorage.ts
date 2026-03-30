import AsyncStorage from '@react-native-async-storage/async-storage';
import { SRSState } from '../types/vocab';
import { today } from '../utils/dateUtils';

const PREFIX = '@cl:grammar:';

function grammarKey(ruleId: string): string {
  return PREFIX + ruleId;
}

export function newGrammarSRSState(ruleId: string): SRSState {
  const now = today();
  return {
    cardId: ruleId,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: now,
    firstSeenDate: now,
    lastReviewDate: now,
    lapses: 0,
  };
}

export async function getGrammarSRSState(ruleId: string): Promise<SRSState | null> {
  const raw = await AsyncStorage.getItem(grammarKey(ruleId));
  if (!raw) return null;
  return JSON.parse(raw) as SRSState;
}

export async function saveGrammarSRSState(state: SRSState): Promise<void> {
  await AsyncStorage.setItem(grammarKey(state.cardId), JSON.stringify(state));
}

export async function getAllGrammarSRSStates(
  ruleIds: string[],
): Promise<Record<string, SRSState>> {
  const keys = ruleIds.map(grammarKey);
  const pairs = await AsyncStorage.multiGet(keys);
  const result: Record<string, SRSState> = {};
  for (const [key, value] of pairs) {
    if (value) {
      const state = JSON.parse(value) as SRSState;
      result[state.cardId] = state;
    }
  }
  return result;
}

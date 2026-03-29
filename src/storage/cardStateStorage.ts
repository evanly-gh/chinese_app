import AsyncStorage from '@react-native-async-storage/async-storage';
import { SRSState } from '../types/vocab';
import { KEYS } from './keys';

function srsKey(cardId: string): string {
  return KEYS.SRS_PREFIX + cardId;
}

export async function getSRSState(cardId: string): Promise<SRSState | null> {
  const raw = await AsyncStorage.getItem(srsKey(cardId));
  return raw ? (JSON.parse(raw) as SRSState) : null;
}

export async function saveSRSState(state: SRSState): Promise<void> {
  await AsyncStorage.setItem(srsKey(state.cardId), JSON.stringify(state));
}

export async function getAllSRSStates(cardIds: string[]): Promise<Record<string, SRSState>> {
  const keys = cardIds.map(srsKey);
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

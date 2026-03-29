import { VocabCard } from '../types/vocab';

import hsk1 from './hsk/hsk1.json';
import hsk2 from './hsk/hsk2.json';
import hsk3 from './hsk/hsk3.json';
import hsk4 from './hsk/hsk4.json';
import hsk5 from './hsk/hsk5.json';
import hsk6 from './hsk/hsk6.json';
import hsk7 from './hsk/hsk7.json';
import hsk8 from './hsk/hsk8.json';
import hsk9 from './hsk/hsk9.json';

const levelMap: Record<number, VocabCard[]> = {
  1: hsk1 as VocabCard[],
  2: hsk2 as VocabCard[],
  3: hsk3 as VocabCard[],
  4: hsk4 as VocabCard[],
  5: hsk5 as VocabCard[],
  6: hsk6 as VocabCard[],
  7: hsk7 as VocabCard[],
  8: hsk8 as VocabCard[],
  9: hsk9 as VocabCard[],
};

export function getCardsForLevel(level: number): VocabCard[] {
  return levelMap[level] ?? [];
}

export function getCardById(id: string): VocabCard | undefined {
  for (const cards of Object.values(levelMap)) {
    const found = cards.find(c => c.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getAllCardIds(level: number): string[] {
  return getCardsForLevel(level).map(c => c.id);
}

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type HSKLevel = typeof LEVELS[number];

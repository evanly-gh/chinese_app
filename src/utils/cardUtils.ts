import { VocabCard, SRSState } from '../types/vocab';
import { today } from './dateUtils';

export function isDue(state: SRSState): boolean {
  return state.dueDate <= today();
}

export function buildSessionQueue(
  cards: VocabCard[],
  states: Record<string, SRSState>,
  newCardsPerSession: number,
  dailyGoal: number,
): VocabCard[] {
  const dueCards: VocabCard[] = [];
  const newCards: VocabCard[] = [];

  for (const card of cards) {
    const state = states[card.id];
    if (!state) {
      newCards.push(card);
    } else if (isDue(state)) {
      dueCards.push(card);
    }
  }

  // Sort due: oldest first, then weakest EF first
  dueCards.sort((a, b) => {
    const sa = states[a.id];
    const sb = states[b.id];
    if (sa.dueDate !== sb.dueDate) return sa.dueDate < sb.dueDate ? -1 : 1;
    return sa.efactor - sb.efactor;
  });

  const sessionNew = newCards.slice(0, newCardsPerSession);
  const combined = [...sessionNew, ...dueCards];
  return combined.slice(0, dailyGoal);
}

export function getLevelStats(
  cards: VocabCard[],
  states: Record<string, SRSState>,
): { learned: number; total: number } {
  const learned = cards.filter(c => states[c.id] && states[c.id].repetition >= 1).length;
  return { learned, total: cards.length };
}

export function getWeakCards(
  cards: VocabCard[],
  states: Record<string, SRSState>,
  limit = 20,
): Array<VocabCard & { efactor: number }> {
  return cards
    .filter(c => states[c.id])
    .map(c => ({ ...c, efactor: states[c.id].efactor }))
    .sort((a, b) => a.efactor - b.efactor)
    .slice(0, limit);
}

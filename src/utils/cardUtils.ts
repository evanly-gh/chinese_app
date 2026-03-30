import { VocabCard, SRSState } from '../types/vocab';
import { FlashcardSessionConfig } from '../types/settings';
import { isMastered, MASTERY_INTERVAL } from '../algorithms/sm2';
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

export function buildConfiguredQueue(
  cards: VocabCard[],
  states: Record<string, SRSState>,
  config: FlashcardSessionConfig,
): VocabCard[] {
  let pool = cards.filter(c => config.levelFilter.includes(c.level));

  switch (config.sortMode) {
    case 'due-first': {
      const due = pool.filter(c => states[c.id] && isDue(states[c.id]));
      const rest = pool.filter(c => !states[c.id] || !isDue(states[c.id]));
      due.sort((a, b) => (states[a.id]?.efactor ?? 2.5) - (states[b.id]?.efactor ?? 2.5));
      pool = [...due, ...rest];
      break;
    }
    case 'difficulty':
      pool = pool
        .filter(c => states[c.id])
        .sort((a, b) => states[a.id].efactor - states[b.id].efactor);
      break;
    case 'familiarity':
      pool = pool
        .filter(c => states[c.id])
        .sort((a, b) => states[a.id].repetition - states[b.id].repetition);
      break;
    case 'random':
      pool = pool.slice().sort(() => Math.random() - 0.5);
      break;
    case 'sequential':
      // Keep existing order (curriculum order from JSON)
      break;
  }

  return pool.slice(0, config.sessionSize);
}

export function getMasteredCards(
  cards: VocabCard[],
  states: Record<string, SRSState>,
): VocabCard[] {
  return cards.filter(c => states[c.id] && isMastered(states[c.id]));
}

export function getWorkingSet(
  cards: VocabCard[],
  states: Record<string, SRSState>,
  windowSize: number,
): VocabCard[] {
  // A card is "active" in the working set if:
  // - Never seen (no state), OR
  // - Seen but not yet at interval >= 6 (hasn't graduated to weekly SRS schedule)
  // Cards with interval >= 6 have been reviewed enough to leave the active window.
  // Cards with interval >= 21 are mastered.
  const isActive = (c: VocabCard) => {
    const s = states[c.id];
    if (!s) return true;              // unseen — active
    if (isMastered(s)) return false;  // mastered — not in working set
    return s.interval < 6;           // only keep in active set until weekly interval
  };

  // Find first active card to establish window position
  const firstActive = cards.findIndex(isActive);
  if (firstActive === -1) return [];

  // Collect up to windowSize active cards scanning forward from that position
  const result: VocabCard[] = [];
  for (let i = firstActive; i < cards.length && result.length < windowSize; i++) {
    if (isActive(cards[i])) result.push(cards[i]);
  }
  return result;
}

export function getReviewCards(
  masteredCards: VocabCard[],
  count: number,
): VocabCard[] {
  const shuffled = masteredCards.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getLevelStats(
  cards: VocabCard[],
  states: Record<string, SRSState>,
): { learned: number; total: number; mastered: number } {
  const learned = cards.filter(c => states[c.id] && states[c.id].repetition >= 1).length;
  const mastered = cards.filter(c => states[c.id] && isMastered(states[c.id])).length;
  return { learned, total: cards.length, mastered };
}

export function getWeakCards(
  cards: VocabCard[],
  states: Record<string, SRSState>,
  limit = 20,
): Array<VocabCard & { efactor: number; lapses: number }> {
  return cards
    .filter(c => states[c.id])
    .map(c => ({ ...c, efactor: states[c.id].efactor, lapses: states[c.id].lapses }))
    .sort((a, b) => a.efactor - b.efactor)
    .slice(0, limit);
}

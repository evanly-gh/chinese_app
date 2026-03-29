import { DifficultyRating } from '../types/review';
import { SRSState } from '../types/vocab';
import { addDays, today } from '../utils/dateUtils';

function ratingToGrade(rating: DifficultyRating): number {
  switch (rating) {
    case 'again': return 0;
    case 'hard':  return 2;
    case 'good':  return 4;
    case 'easy':  return 5;
  }
}

export const MASTERY_INTERVAL = 21;

export function isMastered(state: SRSState): boolean {
  return state.interval >= MASTERY_INTERVAL;
}

export function applySM2(
  state: SRSState,
  rating: DifficultyRating,
  isFirstSeen: boolean = false,
): SRSState {
  const grade = ratingToGrade(rating);
  const now = today();

  // First-time "easy/know" instantly masters the card
  if (isFirstSeen && rating === 'easy') {
    return {
      ...state,
      interval: MASTERY_INTERVAL,
      repetition: 3,
      efactor: 2.5,
      lapses: 0,
      dueDate: addDays(now, MASTERY_INTERVAL),
      lastReviewDate: now,
    };
  }

  let { interval, repetition, efactor, lapses } = state;

  if (grade >= 3) {
    if (repetition === 0)      interval = 1;
    else if (repetition === 1) interval = 6;
    else                       interval = Math.round(interval * efactor);
    repetition += 1;
  } else {
    lapses += 1;
    repetition = 0;
    interval = 1;
  }

  efactor = Math.max(
    1.3,
    efactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
  );

  return {
    ...state,
    interval,
    repetition,
    efactor,
    lapses,
    dueDate: addDays(now, interval),
    lastReviewDate: now,
  };
}

export function newSRSState(cardId: string): SRSState {
  const now = today();
  return {
    cardId,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: now,
    firstSeenDate: now,
    lastReviewDate: now,
    lapses: 0,
  };
}

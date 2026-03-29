export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewEvent {
  cardId: string;
  rating: DifficultyRating;
  timestamp: number;
  responseTimeMs: number;
}

export interface DailyLog {
  date: string;
  newCards: number;
  reviewedCards: number;
  events: ReviewEvent[];
}

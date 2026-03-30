export type DifficultyRating = 'unknown' | 'in_progress' | 'known';

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

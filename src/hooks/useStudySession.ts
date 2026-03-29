import { useState, useEffect, useCallback, useRef } from 'react';
import { VocabCard } from '../types/vocab';
import { DifficultyRating } from '../types/review';
import { applySM2, newSRSState } from '../algorithms/sm2';
import { buildSessionQueue } from '../utils/cardUtils';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getAllSRSStates, saveSRSState } from '../storage/cardStateStorage';
import { appendReviewEvent } from '../storage/reviewHistoryStorage';
import { getSettings } from '../storage/settingsStorage';
import { today } from '../utils/dateUtils';

interface SessionStats {
  total: number;
  completed: number;
  correct: number;
}

interface UseStudySessionReturn {
  currentCard: VocabCard | null;
  queue: VocabCard[];
  stats: SessionStats;
  isFlipped: boolean;
  loading: boolean;
  sessionComplete: boolean;
  flipCard: () => void;
  rateCard: (rating: DifficultyRating) => Promise<void>;
  resetSession: () => Promise<void>;
}

export function useStudySession(): UseStudySessionReturn {
  const [queue, setQueue] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats>({ total: 0, completed: 0, correct: 0 });
  const cardStartTime = useRef(Date.now());
  const newCardIds = useRef<Set<string>>(new Set());

  const loadSession = useCallback(async () => {
    setLoading(true);
    const settings = await getSettings();
    const cards = getCardsForLevel(settings.activeLevel);
    const cardIds = getAllCardIds(settings.activeLevel);
    const states = await getAllSRSStates(cardIds);

    // Track which cards are new (no state yet)
    const newIds = new Set(cards.filter(c => !states[c.id]).map(c => c.id));
    newCardIds.current = newIds;

    const sessionQueue = buildSessionQueue(
      cards,
      states,
      settings.newCardsPerSession,
      settings.dailyGoal,
    );

    setQueue(sessionQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ total: sessionQueue.length, completed: 0, correct: 0 });
    cardStartTime.current = Date.now();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const flipCard = useCallback(() => {
    setIsFlipped(f => !f);
  }, []);

  const rateCard = useCallback(async (rating: DifficultyRating) => {
    const card = queue[currentIndex];
    if (!card) return;

    const responseTimeMs = Date.now() - cardStartTime.current;
    const isNew = newCardIds.current.has(card.id);

    // Load or create SRS state
    const settings = await getSettings();
    const cardIds = getAllCardIds(settings.activeLevel);
    const states = await getAllSRSStates(cardIds);
    const existingState = states[card.id] ?? newSRSState(card.id);
    const newState = applySM2(existingState, rating);
    await saveSRSState(newState);

    await appendReviewEvent(
      { cardId: card.id, rating, timestamp: Date.now(), responseTimeMs },
      isNew,
    );

    const isCorrect = rating === 'good' || rating === 'easy';
    setStats(prev => ({
      ...prev,
      completed: prev.completed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
    cardStartTime.current = Date.now();
  }, [queue, currentIndex]);

  const sessionComplete = !loading && currentIndex >= queue.length;
  const currentCard = queue[currentIndex] ?? null;

  return {
    currentCard,
    queue,
    stats,
    isFlipped,
    loading,
    sessionComplete,
    flipCard,
    rateCard,
    resetSession: loadSession,
  };
}

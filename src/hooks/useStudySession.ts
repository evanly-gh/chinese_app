import { useState, useEffect, useCallback, useRef } from 'react';
import { VocabCard } from '../types/vocab';
import { SRSState } from '../types/vocab';
import { DifficultyRating } from '../types/review';
import { FlashcardSessionConfig } from '../types/settings';
import { applySM2, newSRSState } from '../algorithms/sm2';
import { buildSessionQueue, buildConfiguredQueue } from '../utils/cardUtils';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getAllSRSStates, saveSRSState } from '../storage/cardStateStorage';
import { appendReviewEvent, getDailyLog } from '../storage/reviewHistoryStorage';
import { getSettings } from '../storage/settingsStorage';
import { supabase } from '../lib/supabase';
import { pushSRSStates, pushDailyLog } from '../storage/cloudSync';
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

export function useStudySession(
  sessionConfig?: FlashcardSessionConfig,
  sessionKey?: number,
): UseStudySessionReturn {
  const [queue, setQueue] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats>({ total: 0, completed: 0, correct: 0 });
  const cardStartTime = useRef(Date.now());
  const newCardIds = useRef<Set<string>>(new Set());
  const touchedStates = useRef<SRSState[]>([]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const settings = await getSettings();

    let sessionQueue: VocabCard[];

    if (sessionConfig) {
      // Configured session: pull from all specified levels
      const allCards: VocabCard[] = [];
      for (const level of sessionConfig.levelFilter) {
        allCards.push(...getCardsForLevel(level));
      }
      const allIds = allCards.map(c => c.id);
      const states = await getAllSRSStates(allIds);
      const newIds = new Set(allCards.filter(c => !states[c.id]).map(c => c.id));
      newCardIds.current = newIds;
      sessionQueue = buildConfiguredQueue(allCards, states, sessionConfig);
    } else {
      // Default session: active level, SRS queue
      const cards = getCardsForLevel(settings.activeLevel);
      const cardIds = getAllCardIds(settings.activeLevel);
      const states = await getAllSRSStates(cardIds);
      const newIds = new Set(cards.filter(c => !states[c.id]).map(c => c.id));
      newCardIds.current = newIds;
      sessionQueue = buildSessionQueue(
        cards,
        states,
        settings.newCardsPerSession,
        settings.dailyGoal,
      );
    }

    touchedStates.current = [];
    setQueue(sessionQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ total: sessionQueue.length, completed: 0, correct: 0 });
    cardStartTime.current = Date.now();
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

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

    // Load or create SRS state (fetch just this card's state by ID)
    const states = await getAllSRSStates([card.id]);
    const existingState = states[card.id] ?? newSRSState(card.id);
    const isFirstSeen = existingState.repetition === 0;
    const newState = applySM2(existingState, rating, isFirstSeen);
    await saveSRSState(newState);
    touchedStates.current.push(newState);

    await appendReviewEvent(
      { cardId: card.id, rating, timestamp: Date.now(), responseTimeMs },
      isNew,
    );

    const isCorrect = rating === 'known';
    const nextCompleted = (currentIndex) + 1; // cards rated so far after this one
    const isLastCard = nextCompleted >= queue.length;

    setStats(prev => ({
      ...prev,
      completed: prev.completed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
    cardStartTime.current = Date.now();

    // Push to cloud when the session finishes
    if (isLastCard) {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const log = await getDailyLog(today());
        pushSRSStates(uid, touchedStates.current).catch(() => {});
        pushDailyLog(uid, log).catch(() => {});
      }
    }
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

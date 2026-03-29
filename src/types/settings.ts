export type FlashcardSortMode = 'familiarity' | 'difficulty' | 'random' | 'sequential' | 'due-first';

export interface FlashcardSessionConfig {
  sessionSize: number;
  levelFilter: number[];
  sortMode: FlashcardSortMode;
}

export interface AppSettings {
  schemaVersion: number;
  activeLevel: number;
  dailyGoal: number;
  ttsEnabled: boolean;
  useTraditional: boolean;
  darkModeOverride: 'system' | 'light' | 'dark';
  newCardsPerSession: number;
  showPinyin: boolean;
  listenExercisesEnabled: boolean;
  workingSetSize: number;
  flashcardConfig: FlashcardSessionConfig;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  activeLevel: 1,
  dailyGoal: 20,
  ttsEnabled: true,
  useTraditional: false,
  darkModeOverride: 'system',
  newCardsPerSession: 10,
  showPinyin: true,
  listenExercisesEnabled: true,
  workingSetSize: 10,
  flashcardConfig: {
    sessionSize: 20,
    levelFilter: [1],
    sortMode: 'due-first',
  },
};

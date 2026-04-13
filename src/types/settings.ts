export type FlashcardSortMode = 'familiarity' | 'difficulty' | 'random' | 'due-first';

export interface FlashcardSessionConfig {
  sessionSize: number;
  levelFilter: number[];
  sortMode: FlashcardSortMode;
}

export interface AppSettings {
  schemaVersion: number;
  activeLevels: number[];
  dailyGoal: number;
  ttsEnabled: boolean;
  useTraditional: boolean;
  theme: 'light' | 'dark' | 'custom';
  customTheme: { primary: string; base: 'light' | 'dark' };
  newCardsPerSession: number;
  showPinyin: boolean;
  listenExercisesEnabled: boolean;
  workingSetSize: number;
  flashcardConfig: FlashcardSessionConfig;
  exerciseLevelFilter: number[];
  exerciseContentType: 'vocabulary' | 'grammar' | 'mixed';
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  activeLevels: [1],
  dailyGoal: 20,
  ttsEnabled: true,
  useTraditional: false,
  theme: 'light',
  customTheme: { primary: '#D32F2F', base: 'light' },
  newCardsPerSession: 10,
  showPinyin: true,
  listenExercisesEnabled: true,
  workingSetSize: 10,
  flashcardConfig: {
    sessionSize: 20,
    levelFilter: [1],
    sortMode: 'due-first',
  },
  exerciseLevelFilter: [1],
  exerciseContentType: 'vocabulary',
};

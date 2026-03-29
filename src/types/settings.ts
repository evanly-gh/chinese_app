export interface AppSettings {
  schemaVersion: number;
  activeLevel: number;
  dailyGoal: number;
  ttsEnabled: boolean;
  useTraditional: boolean;
  darkModeOverride: 'system' | 'light' | 'dark';
  newCardsPerSession: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  activeLevel: 1,
  dailyGoal: 20,
  ttsEnabled: true,
  useTraditional: false,
  darkModeOverride: 'system',
  newCardsPerSession: 10,
};

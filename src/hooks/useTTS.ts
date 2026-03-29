import { useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useSettings } from './useSettings';

export function useTTS() {
  const { settings } = useSettings();

  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled) return;
    Speech.speak(text, {
      language: settings.useTraditional ? 'zh-TW' : 'zh-CN',
      rate: 0.85,
    });
  }, [settings.ttsEnabled, settings.useTraditional]);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, stop };
}

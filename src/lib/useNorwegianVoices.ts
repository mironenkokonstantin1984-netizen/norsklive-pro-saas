'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  LOADING_VOICE_SNAPSHOT,
  getVoiceSnapshot,
  refreshVoices,
  subscribeVoices,
  type VoiceSnapshot
} from './speech';

/** The Norwegian voices of this device and the chosen one. Loads them on first use. */
export function useNorwegianVoices(): VoiceSnapshot {
  const snapshot = useSyncExternalStore(
    subscribeVoices,
    getVoiceSnapshot,
    () => LOADING_VOICE_SNAPSHOT
  );
  useEffect(() => {
    void refreshVoices();
  }, []);
  return snapshot;
}

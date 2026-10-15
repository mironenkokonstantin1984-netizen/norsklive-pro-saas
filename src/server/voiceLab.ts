import { parseTtsLabVoices } from './tts/registry';
import type { TtsVoiceInfo } from './tts/types';

export function isVoiceLabEnabled(): boolean {
  return process.env.VOICE_LAB_ENABLED === 'true';
}

export function getVoiceLabModels(): string[] {
  const raw = process.env.VOICE_LAB_MODELS ?? '';
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

export function getTtsLabVoices(): TtsVoiceInfo[] {
  return parseTtsLabVoices(process.env.TTS_LAB_VOICES);
}

import { AzureTtsAdapter } from './azureAdapter';
import { ElevenLabsTtsAdapter } from './elevenLabsAdapter';
import { GoogleTtsAdapter } from './googleAdapter';
import type { TtsAdapter, TtsProviderName, TtsVoiceInfo } from './types';

export function createDefaultAdapters(): Record<TtsProviderName, TtsAdapter> {
  return {
    google: new GoogleTtsAdapter(),
    azure: new AzureTtsAdapter(),
    elevenlabs: new ElevenLabsTtsAdapter()
  };
}

export function parseTtsLabVoices(
  rawEnv: string | undefined,
  adapters: Record<TtsProviderName, TtsAdapter> = createDefaultAdapters()
): TtsVoiceInfo[] {
  if (!rawEnv) return [];

  const parts = rawEnv
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const list: TtsVoiceInfo[] = [];

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;

    const providerStr = part.slice(0, colonIdx).trim().toLowerCase();
    const voice = part.slice(colonIdx + 1).trim();

    if (!voice) continue;

    if (
      providerStr === 'google' ||
      providerStr === 'azure' ||
      providerStr === 'elevenlabs'
    ) {
      const provider = providerStr as TtsProviderName;
      const adapter = adapters[provider];
      const isConfigured = adapter ? adapter.isConfigured() : false;
      const isOutOfEu = adapter ? adapter.isOutOfEu() : false;

      let region: string | undefined;
      if (provider === 'azure') {
        region = process.env.AZURE_SPEECH_REGION || 'norwayeast';
      }

      list.push({
        provider,
        voice,
        isConfigured,
        isOutOfEu,
        region
      });
    }
  }

  return list;
}

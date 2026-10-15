import type { TtsAdapter, TtsSynthesizeOptions, TtsSynthesizeResult } from './types';

export const GOOGLE_TTS_EU_ENDPOINT = 'https://eu-texttospeech.googleapis.com/v1/text:synthesize';

export class GoogleTtsAdapter implements TtsAdapter {
  readonly provider = 'google' as const;

  constructor(private readonly getApiKey = () => process.env.GOOGLE_TTS_KEY) {}

  isConfigured(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(key && key.length > 0);
  }

  isOutOfEu(): boolean {
    return false; // Uses eu-texttospeech.googleapis.com (EU location)
  }

  async synthesize(
    options: TtsSynthesizeOptions,
    fetchFn = globalThis.fetch
  ): Promise<TtsSynthesizeResult> {
    const apiKey = this.getApiKey()?.trim();
    if (!apiKey) {
      throw new Error('Ключ для провайдера Google TTS (GOOGLE_TTS_KEY) не настроен');
    }

    const startTime = Date.now();
    const charCount = options.text.length;

    // Detect language code from voice name prefix (e.g., nb-NO-Chirp3-HD-Aoede -> nb-NO)
    const matchLang = options.voice.match(/^([a-z]{2,3}-[A-Z]{2})/);
    const languageCode = matchLang ? matchLang[1] : 'nb-NO';

    const payload = {
      input: { text: options.text },
      voice: {
        languageCode,
        name: options.voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options.rate ?? 1.0
      }
    };

    let res: Response;
    try {
      res = await fetchFn(GOOGLE_TTS_EU_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Превышено время ожидания ответа от Google TTS (тайм-аут 15 с)');
      }
      const message = err instanceof Error ? err.message : 'Сетевая ошибка';
      throw new Error(`Ошибка подключения к Google TTS: ${message}`);
    }

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      let detail = '';
      try {
        const errorJson = (await res.json()) as { error?: { message?: string } };
        detail = errorJson.error?.message ? `: ${errorJson.error.message}` : '';
      } catch {
        detail = `: HTTP ${res.status}`;
      }
      throw new Error(`Google TTS вернул ошибку (${res.status})${detail}`);
    }

    const data = (await res.json()) as { audioContent?: string };
    if (!data.audioContent) {
      throw new Error('Google TTS не вернул audioContent');
    }

    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
      latencyMs,
      charCount,
      provider: this.provider,
      voice: options.voice,
      isOutOfEu: false
    };
  }
}

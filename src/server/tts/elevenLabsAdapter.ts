import type { TtsAdapter, TtsSynthesizeOptions, TtsSynthesizeResult } from './types';

export const ELEVENLABS_DEFAULT_BASE_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsTtsAdapter implements TtsAdapter {
  readonly provider = 'elevenlabs' as const;

  constructor(
    private readonly getApiKey = () => process.env.ELEVENLABS_API_KEY,
    private readonly getBaseUrl = () =>
      process.env.ELEVENLABS_BASE_URL || ELEVENLABS_DEFAULT_BASE_URL
  ) {}

  isConfigured(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(key && key.length > 0);
  }

  isOutOfEu(): boolean {
    const url = this.getBaseUrl().toLowerCase();
    // Default infrastructure is in the US; EU residency requires enterprise endpoint
    return !url.includes('.eu.') && !url.includes('-eu.') && !url.includes('/eu');
  }

  async synthesize(
    options: TtsSynthesizeOptions,
    fetchFn = globalThis.fetch
  ): Promise<TtsSynthesizeResult> {
    const apiKey = this.getApiKey()?.trim();
    if (!apiKey) {
      throw new Error('Ключ для провайдера ElevenLabs (ELEVENLABS_API_KEY) не настроен');
    }

    const baseUrl = this.getBaseUrl().replace(/\/+$/, '');
    const endpoint = `${baseUrl}/text-to-speech/${encodeURIComponent(options.voice)}`;

    const startTime = Date.now();
    const charCount = options.text.length;

    const payload = {
      text: options.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    };

    let res: Response;
    try {
      res = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          'xi-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Превышено время ожидания ответа от ElevenLabs (тайм-аут 15 с)');
      }
      const message = err instanceof Error ? err.message : 'Сетевая ошибка';
      throw new Error(`Ошибка подключения к ElevenLabs: ${message}`);
    }

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      let detail = '';
      try {
        const errorJson = (await res.json()) as { detail?: { message?: string } | string };
        const msg =
          typeof errorJson.detail === 'string'
            ? errorJson.detail
            : errorJson.detail?.message;
        detail = msg ? `: ${msg}` : '';
      } catch {
        detail = `: HTTP ${res.status}`;
      }
      throw new Error(`ElevenLabs вернул ошибку (${res.status})${detail}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
      latencyMs,
      charCount,
      provider: this.provider,
      voice: options.voice,
      isOutOfEu: this.isOutOfEu()
    };
  }
}

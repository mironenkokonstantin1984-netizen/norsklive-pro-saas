import type { TtsAdapter, TtsSynthesizeOptions, TtsSynthesizeResult } from './types';

export const KNOWN_EU_AZURE_REGIONS = new Set([
  'norwayeast',
  'norwaywest',
  'westeurope',
  'northeurope',
  'swedencentral',
  'germanywestcentral',
  'francecentral',
  'switzerlandnorth',
  'polandcentral',
  'italynorth',
  'spaincentral'
]);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class AzureTtsAdapter implements TtsAdapter {
  readonly provider = 'azure' as const;

  constructor(
    private readonly getApiKey = () => process.env.AZURE_SPEECH_KEY,
    private readonly getRegion = () => process.env.AZURE_SPEECH_REGION || 'norwayeast'
  ) {}

  isConfigured(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(key && key.length > 0);
  }

  isOutOfEu(): boolean {
    const region = this.getRegion().trim().toLowerCase();
    return !KNOWN_EU_AZURE_REGIONS.has(region);
  }

  async synthesize(
    options: TtsSynthesizeOptions,
    fetchFn = globalThis.fetch
  ): Promise<TtsSynthesizeResult> {
    const apiKey = this.getApiKey()?.trim();
    if (!apiKey) {
      throw new Error('Ключ для провайдера Azure AI Speech (AZURE_SPEECH_KEY) не настроен');
    }

    const region = (this.getRegion() || 'norwayeast').trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(region)) {
      throw new Error('Недопустимый регион Azure AI Speech (AZURE_SPEECH_REGION)');
    }
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const startTime = Date.now();
    const charCount = options.text.length;
    const escaped = escapeXml(options.text);

    const rateAttr =
      options.rate && options.rate !== 1.0 ? ` rate='${options.rate}'` : '';
    const bodyContent = rateAttr
      ? `<prosody${rateAttr}>${escaped}</prosody>`
      : escaped;

    const ssml = `<speak version='1.0' xml:lang='nb-NO'><voice xml:lang='nb-NO' name='${escapeXml(
      options.voice
    )}'>${bodyContent}</voice></speak>`;

    let res: Response;
    try {
      res = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'NorskLive-TTS-Lab',
          'Ocp-Apim-Subscription-Key': apiKey
        },
        body: ssml,
        signal: AbortSignal.timeout(15000)
      });
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Превышено время ожидания ответа от Azure AI Speech (тайм-аут 15 с)');
      }
      const message = err instanceof Error ? err.message : 'Сетевая ошибка';
      throw new Error(`Ошибка подключения к Azure AI Speech: ${message}`);
    }

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      let detail = '';
      try {
        const text = await res.text();
        detail = text ? `: ${text.slice(0, 200)}` : '';
      } catch {
        detail = `: HTTP ${res.status}`;
      }
      throw new Error(`Azure AI Speech вернул ошибку (${res.status})${detail}`);
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

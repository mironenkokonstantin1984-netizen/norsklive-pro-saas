import { z } from 'zod';
import { createRateLimiter, type RateLimitCheckFn, type RateLimitOptions } from '../rateLimit';
import { isVoiceLabEnabled } from '../voiceLab';
import { createDefaultAdapters } from './registry';
import type { TtsAdapter, TtsProviderName } from './types';

export const MAX_TTS_TEXT_LENGTH = 400;

export const TtsRequestSchema = z.object({
  provider: z.enum(['google', 'azure', 'elevenlabs'], {
    errorMap: () => ({ message: 'Провайдер должен быть google, azure или elevenlabs' })
  }),
  voice: z
    .string({ required_error: 'Голос обязателен' })
    .trim()
    .min(1, 'Голос обязателен')
    .max(120, 'Название голоса слишком длинное'),
  text: z
    .string({ required_error: 'Текст не может быть пустым' })
    .trim()
    .min(1, 'Текст не может быть пустым')
    .max(MAX_TTS_TEXT_LENGTH, `Текст не должен превышать ${MAX_TTS_TEXT_LENGTH} символов`),
  rate: z
    .number()
    .min(0.25, 'Скорость должна быть не менее 0.25')
    .max(3.0, 'Скорость должна быть не более 3.0')
    .optional()
});

export type TtsRequest = z.infer<typeof TtsRequestSchema>;

export interface TtsHandlerDeps {
  fetchImpl?: typeof globalThis.fetch;
  enabled?: () => boolean;
  adapters?: Record<TtsProviderName, TtsAdapter>;
  rateLimit?: RateLimitCheckFn | RateLimitOptions;
}

export function createTtsHandler(deps: TtsHandlerDeps = {}) {
  const checkEnabled = deps.enabled ?? isVoiceLabEnabled;
  const adapters = deps.adapters ?? createDefaultAdapters();
  const checkRateLimit: RateLimitCheckFn =
    typeof deps.rateLimit === 'function'
      ? deps.rateLimit
      : createRateLimiter(deps.rateLimit ?? { max: 30, windowMs: 10 * 60 * 1000 });
  const fetchFn = deps.fetchImpl ?? globalThis.fetch;

  return async (req: Request): Promise<Response> => {
    if (!checkEnabled()) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (!checkRateLimit(req)) {
      return Response.json(
        { error: 'Превышен лимит запросов к TTS-лаборатории. Попробуйте позже.' },
        { status: 429 }
      );
    }

    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      return Response.json(
        { error: 'Неверный формат JSON в теле запроса' },
        { status: 400 }
      );
    }

    const parsed = TtsRequestSchema.safeParse(bodyJson);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Неверные параметры запроса';
      return Response.json(
        {
          error: firstIssue,
          issues: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const { provider, voice, text, rate } = parsed.data;
    const adapter = adapters[provider];

    if (!adapter) {
      return Response.json(
        { error: `Неизвестный провайдер: ${provider}` },
        { status: 400 }
      );
    }

    if (!adapter.isConfigured()) {
      const envName =
        provider === 'google'
          ? 'GOOGLE_TTS_KEY'
          : provider === 'azure'
            ? 'AZURE_SPEECH_KEY'
            : 'ELEVENLABS_API_KEY';
      return Response.json(
        {
          error: `Ключ для провайдера ${provider} (${envName}) не настроен в переменных окружения`
        },
        { status: 400 }
      );
    }

    try {
      const result = await adapter.synthesize({ text, voice, rate }, fetchFn);

      return new Response(new Uint8Array(result.audioBuffer), {
        status: 200,
        headers: {
          'Content-Type': result.mimeType || 'audio/mpeg',
          'Content-Length': result.audioBuffer.length.toString(),
          'x-tts-latency-ms': result.latencyMs.toString(),
          'x-tts-chars': result.charCount.toString(),
          'x-tts-out-of-eu': result.isOutOfEu ? 'true' : 'false',
          'Cache-Control': 'no-store'
        }
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Сбой синтеза речи';
      // Sanitize: ensure no potential API keys or tokens are in message
      const sanitized = rawMessage.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
      return Response.json(
        { error: sanitized },
        { status: 502 }
      );
    }
  };
}

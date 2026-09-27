import { CoachRequestSchema, CoachResponseSchema, type CoachResponse } from './schemas';
import { buildGeminiCoachPayload } from './prompts/coach';
import {
  generateStrategicRAndDFallback,
  findScenario,
  type FallbackInput
} from './fallback';
import {
  createRateLimiter,
  type RateLimitCheckFn,
  type RateLimitOptions
} from './rateLimit';

const MAX_BODY_BYTES = 16 * 1024;

export interface CoachHandlerDeps {
  fetchImpl?: typeof globalThis.fetch;
  fallbackImpl?: (input: FallbackInput) => CoachResponse;
  rateLimit?: RateLimitCheckFn | RateLimitOptions;
}

export function createCoachHandler(
  deps: CoachHandlerDeps = {}
): (req: Request) => Promise<Response> {
  const checkRateLimit: RateLimitCheckFn =
    typeof deps.rateLimit === 'function'
      ? deps.rateLimit
      : createRateLimiter(deps.rateLimit);

  return async (req: Request): Promise<Response> => {
    try {
      if (!checkRateLimit(req)) {
        return Response.json(
          { error: 'Too many requests, please try again later.' },
          { status: 429 }
        );
      }

      const contentLengthHeader = req.headers.get('content-length');
      if (contentLengthHeader && Number(contentLengthHeader) > MAX_BODY_BYTES) {
        return Response.json({ error: 'Payload too large' }, { status: 413 });
      }

      const rawBody = await req.text();
      if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
        return Response.json({ error: 'Payload too large' }, { status: 413 });
      }

      let jsonBody: unknown;
      try {
        jsonBody = rawBody.length > 0 ? JSON.parse(rawBody) : {};
      } catch {
        return Response.json({ error: 'Invalid request payload' }, { status: 400 });
      }

      const parsed = CoachRequestSchema.safeParse(jsonBody);
      if (!parsed.success) {
        return Response.json(
          {
            error: 'Invalid request payload',
            issues: parsed.error.issues
          },
          { status: 400 }
        );
      }

      const {
        module,
        scenarioId,
        level,
        l1,
        persona,
        userText,
        history,
        usedWords,
        customScenario
      } = parsed.data;

      const scenario = findScenario(module, scenarioId, customScenario);
      const apiKey = process.env.GEMINI_API_KEY;
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      if (apiKey && apiKey.trim().length > 0) {
        try {
          const payload = buildGeminiCoachPayload({
            scenario,
            level,
            l1,
            persona,
            userText,
            history,
            usedWords
          });

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            modelName
          )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

          const fetchFn = deps.fetchImpl || globalThis.fetch;
          const response = await fetchFn(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000)
          });

          if (!response.ok) {
            throw new Error(`Gemini HTTP ${response.status}`);
          }

          const data = (await response.json()) as {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string }>;
              };
            }>;
          };
          const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawJson) {
            throw new Error('Empty Gemini response');
          }

          const parsedOutput = JSON.parse(rawJson);
          const validated = CoachResponseSchema.parse(parsedOutput);
          return Response.json(validated, { status: 200 });
        } catch {
          // Fall through to deterministic rule-based fallback on any Gemini error/timeout
        }
      }

      const fallbackFn = deps.fallbackImpl || generateStrategicRAndDFallback;
      const fallbackResult = fallbackFn({
        userText,
        module,
        scenarioId,
        l1,
        persona,
        usedWords,
        customScenario
      });
      const validatedFallback = CoachResponseSchema.parse(fallbackResult);
      return Response.json(validatedFallback, { status: 200 });
    } catch {
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  };
}

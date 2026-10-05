import {
  CoachRequestSchema,
  CoachResponseSchema,
  filterFeedbackErrorsByLearnerText,
  type CoachFeedback,
  type CoachResponse
} from './schemas';
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
import { getSessionUser, isAuthEnabled } from './auth';
import { checkAiQuota, countAiCall, type QuotaCheckResult } from './quota';
import {
  appendTurns,
  getOrCreateSession,
  type PracticeSessionRow,
  type SessionParams,
  type TurnInsertInput
} from './sessions';

const MAX_BODY_BYTES = 16 * 1024;

export interface CoachHandlerDeps {
  fetchImpl?: typeof globalThis.fetch;
  fallbackImpl?: (input: FallbackInput) => CoachResponse;
  rateLimit?: RateLimitCheckFn | RateLimitOptions;
  getUser?: () => Promise<{ id: string } | null>;
  authEnabled?: () => boolean;
  quota?: (userId: string) => Promise<QuotaCheckResult>;
  countCall?: (userId: string) => Promise<void>;
  /** Overrides `COACH_ALLOW_FALLBACK` (dev and tests only). */
  allowFallback?: () => boolean;
  getOrCreateSession?: (
    userId: string,
    params: SessionParams
  ) => Promise<PracticeSessionRow>;
  appendTurns?: (
    sessionId: string,
    userId: string,
    turns: TurnInsertInput[]
  ) => Promise<void>;
}

export function createCoachHandler(
  deps: CoachHandlerDeps = {}
): (req: Request) => Promise<Response> {
  const checkRateLimit: RateLimitCheckFn =
    typeof deps.rateLimit === 'function'
      ? deps.rateLimit
      : createRateLimiter(deps.rateLimit);

  const checkAuthEnabled: () => boolean = deps.authEnabled ?? isAuthEnabled;

  const resolveUser: () => Promise<{ id: string } | null> =
    deps.getUser ?? getSessionUser;

  const checkQuota: (userId: string) => Promise<QuotaCheckResult> =
    deps.quota ?? ((userId: string) => checkAiQuota(userId));

  const recordAiCall: (userId: string) => Promise<void> =
    deps.countCall ?? ((userId: string) => countAiCall(userId));

  const fallbackAllowed: () => boolean =
    deps.allowFallback ?? (() => process.env.COACH_ALLOW_FALLBACK === 'true');

  const resolveSession: (
    userId: string,
    params: SessionParams
  ) => Promise<PracticeSessionRow> =
    deps.getOrCreateSession ?? ((userId, params) => getOrCreateSession(userId, params));

  const persistSessionTurns: (
    sessionId: string,
    userId: string,
    turns: TurnInsertInput[]
  ) => Promise<void> =
    deps.appendTurns ??
    ((sessionId, userId, turns) => appendTurns(sessionId, userId, turns));

  return async (req: Request): Promise<Response> => {
    try {
      let authedUser: { id: string } | null = null;
      if (checkAuthEnabled()) {
        authedUser = await resolveUser();
        if (!authedUser) {
          return Response.json({ error: 'auth_required' }, { status: 401 });
        }
      }

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

      if (authedUser) {
        const quotaResult = await checkQuota(authedUser.id);
        if (!quotaResult.allowed) {
          return Response.json(
            {
              error: 'quota_exceeded',
              limit: quotaResult.limit,
              plan: quotaResult.plan
            },
            { status: 402 }
          );
        }
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

      const persistReply = async (reply: CoachResponse) => {
        if (!authedUser) return;
        try {
          const session = await resolveSession(authedUser.id, {
            module,
            scenarioId,
            level
          });
          await persistSessionTurns(session.id, authedUser.id, [
            { role: 'user', text: userText },
            {
              role: 'ai',
              text: reply.reply_norsk,
              correction_json: reply.feedback ?? reply.correction
            }
          ]);
        } catch {
          console.error('Failed to persist practice session turns.');
        }
      };

      const scenario = findScenario(module, scenarioId, customScenario);
      const apiKey = process.env.GEMINI_API_KEY;
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      if (apiKey && apiKey.trim().length > 0) {
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

        // Try up to 2 times (retry once on invalid JSON / schema error)
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
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

            // Drop errors whose quote is not in the learner's text (case-insensitive)
            if (
              parsedOutput &&
              typeof parsedOutput === 'object' &&
              'feedback' in parsedOutput &&
              parsedOutput.feedback &&
              typeof parsedOutput.feedback === 'object'
            ) {
              parsedOutput.feedback = filterFeedbackErrorsByLearnerText(
                parsedOutput.feedback as CoachFeedback,
                userText
              );
            }

            const validated = CoachResponseSchema.parse(parsedOutput);
            if (authedUser) {
              await recordAiCall(authedUser.id);
            }
            await persistReply(validated);
            return Response.json(validated, { status: 200 });
          } catch {
            // On failure or invalid JSON, loop will retry once. If attempt 2 fails,
            // execution falls through to coach_unavailable below.
          }
        }
      }

      // Never show canned text as if the AI had answered. The fallback exists only for local
      // development and tests, behind COACH_ALLOW_FALLBACK=true, and is marked as an example.
      if (!fallbackAllowed()) {
        return Response.json({ error: 'coach_unavailable' }, { status: 503 });
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
      const validatedFallback = CoachResponseSchema.parse({
        ...fallbackResult,
        source: 'fallback'
      });
      return Response.json(validatedFallback, { status: 200 });
    } catch {
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  };
}

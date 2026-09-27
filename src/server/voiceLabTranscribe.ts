import { z } from 'zod';
import { getVoiceLabModels, isVoiceLabEnabled } from './voiceLab';

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_AUDIO_MIMES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3'
] as const;

export const VERBATIM_TRANSCRIBE_PROMPT =
  'Transcribe exactly what the speaker says in Norwegian Bokmål. Do not correct grammar, word order or word choice. Keep hesitations as "eh". Output only the transcript.';

export const TranscribeInputSchema = z.object({
  size: z
    .number()
    .int()
    .positive('Audio file must not be empty')
    .max(MAX_AUDIO_BYTES, 'Audio exceeds maximum size of 10 MB'),
  mimeType: z
    .string()
    .min(1, 'Audio MIME type is required')
    .transform((v) => v.trim().toLowerCase())
    .refine(
      (v) => {
        const base = v.split(';')[0].trim();
        return (
          (ALLOWED_AUDIO_MIMES as readonly string[]).includes(v) ||
          (ALLOWED_AUDIO_MIMES as readonly string[]).includes(base)
        );
      },
      { message: 'Unsupported audio MIME type' }
    )
});

export interface ModelTranscriptionResult {
  model: string;
  transcript: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export interface TranscribeHandlerDeps {
  fetchImpl?: typeof globalThis.fetch;
  enabled?: () => boolean;
  getModels?: () => string[];
  getApiKey?: () => string | undefined;
}

export function createTranscribeHandler(deps: TranscribeHandlerDeps = {}) {
  const checkEnabled = deps.enabled ?? isVoiceLabEnabled;
  const resolveModels = deps.getModels ?? getVoiceLabModels;
  const resolveApiKey = deps.getApiKey ?? (() => process.env.GEMINI_API_KEY);
  const fetchFn = deps.fetchImpl ?? globalThis.fetch;

  return async (req: Request): Promise<Response> => {
    if (!checkEnabled()) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

    const audioEntry = formData.get('audio');
    if (!audioEntry || typeof audioEntry === 'string') {
      return Response.json({ error: 'Missing audio file in form data' }, { status: 400 });
    }

    const audioBlob = audioEntry as Blob;
    const rawMime = (formData.get('mimeType') as string | null) || audioBlob.type || '';

    const parsed = TranscribeInputSchema.safeParse({
      size: audioBlob.size,
      mimeType: rawMime
    });

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid audio upload',
          issues: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const models = resolveModels();
    if (models.length === 0) {
      return Response.json(
        { error: 'VOICE_LAB_MODELS is not configured' },
        { status: 400 }
      );
    }

    const apiKey = resolveApiKey()?.trim();
    if (!apiKey) {
      return Response.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const baseMimeType = parsed.data.mimeType.split(';')[0].trim();

    const results: ModelTranscriptionResult[] = [];

    for (const model of models) {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`;

      try {
        const response = await fetchFn(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: VERBATIM_TRANSCRIBE_PROMPT },
                  {
                    inline_data: {
                      mime_type: baseMimeType,
                      data: base64Audio
                    }
                  }
                ]
              }
            ]
          }),
          signal: AbortSignal.timeout(60000)
        });

        const latencyMs = Math.max(1, Date.now() - startTime);

        if (!response.ok) {
          results.push({
            model,
            transcript: '',
            latencyMs,
            error: `HTTP ${response.status}`
          });
          continue;
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
          };
        };

        const transcript = (
          data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? '')
            .join('') ?? ''
        ).trim();

        const item: ModelTranscriptionResult = {
          model,
          transcript,
          latencyMs
        };

        if (typeof data?.usageMetadata?.promptTokenCount === 'number') {
          item.inputTokens = data.usageMetadata.promptTokenCount;
        }
        if (typeof data?.usageMetadata?.candidatesTokenCount === 'number') {
          item.outputTokens = data.usageMetadata.candidatesTokenCount;
        }

        results.push(item);
      } catch (err) {
        const latencyMs = Math.max(1, Date.now() - startTime);
        const isTimeout =
          err instanceof Error &&
          (err.name === 'TimeoutError' ||
            err.name === 'AbortError' ||
            /timeout|aborted/i.test(err.message));
        results.push({
          model,
          transcript: '',
          latencyMs,
          error: isTimeout ? 'timeout' : 'request_failed'
        });
      }
    }

    return Response.json(results, { status: 200 });
  };
}

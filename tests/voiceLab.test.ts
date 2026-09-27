import { afterEach, describe, expect, test, vi } from 'vitest';
import { scoreTranscript } from '../src/lib/voiceLab/score';
import {
  createTranscribeHandler,
  MAX_AUDIO_BYTES,
  TranscribeInputSchema,
  VERBATIM_TRANSCRIBE_PROMPT
} from '../src/server/voiceLabTranscribe';
import VoiceLabPage from '../src/app/lab/voice/page';

describe('Voice Lab server & score tests (Issue #20)', () => {
  const originalFlag = process.env.VOICE_LAB_ENABLED;
  const originalModels = process.env.VOICE_LAB_MODELS;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFlag === undefined) {
      delete process.env.VOICE_LAB_ENABLED;
    } else {
      process.env.VOICE_LAB_ENABLED = originalFlag;
    }
    if (originalModels === undefined) {
      delete process.env.VOICE_LAB_MODELS;
    } else {
      process.env.VOICE_LAB_MODELS = originalModels;
    }
  });

  test('1. score.ts: identical text -> WER 0 and error-preservation 100% (normalising case & punctuation)', () => {
    const res = scoreTranscript(
      'I dag jobber jeg hjemmefra.',
      'I dag jobber jeg hjemmefra.',
      'i dag jobber jeg hjemmefra!'
    );
    expect(res.wer).toBe(0);
    expect(res.werPercent).toBe(0);
    expect(res.errorPreservationRate).toBe(100);
  });

  test('2. score.ts: alignment-based error preservation covers (a) leading filler "eh", (b) dropped word before error, and (c) V2 fix -> 0%', () => {
    // (a) meant "I dag jobber jeg", said "eh I dag jeg jobber", transcript "eh I dag jeg jobber" -> 100%
    const caseA = scoreTranscript(
      'I dag jobber jeg',
      'eh I dag jeg jobber',
      'eh I dag jeg jobber'
    );
    expect(caseA.wer).toBe(0);
    expect(caseA.errorPreservationRate).toBe(100);

    // (b) transcript drops a word before the error: said "I dag jeg jobber hjemme", transcript "dag jeg jobber hjemme" -> 100%
    const caseB = scoreTranscript(
      'I dag jobber jeg hjemme',
      'I dag jeg jobber hjemme',
      'dag jeg jobber hjemme'
    );
    expect(caseB.errorPreservationRate).toBe(100);

    // (c) V2 fix: transcript fixes "I dag jeg jobber" -> "I dag jobber jeg" -> 0%
    const caseC = scoreTranscript(
      'I dag jobber jeg',
      'I dag jeg jobber',
      'I dag jobber jeg'
    );
    expect(caseC.errorPreservationRate).toBe(0);
    expect(caseC.wer).toBeGreaterThan(0);
  });

  test('3. Flag off: /api/lab/transcribe and /lab/voice return 404 when VOICE_LAB_ENABLED is not "true"', async () => {
    delete process.env.VOICE_LAB_ENABLED;

    const handler = createTranscribeHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/lab/transcribe', {
        method: 'POST'
      })
    );
    expect(res.status).toBe(404);

    expect(() => VoiceLabPage()).toThrow();
  });

  test('4. Zod validation: rejects >10 MB body and wrong MIME type', async () => {
    const tooLarge = TranscribeInputSchema.safeParse({
      size: MAX_AUDIO_BYTES + 1,
      mimeType: 'audio/webm;codecs=opus'
    });
    expect(tooLarge.success).toBe(false);

    const wrongMime = TranscribeInputSchema.safeParse({
      size: 2048,
      mimeType: 'text/plain'
    });
    expect(wrongMime.success).toBe(false);

    const validWebm = TranscribeInputSchema.safeParse({
      size: 4096,
      mimeType: 'audio/webm;codecs=opus'
    });
    expect(validWebm.success).toBe(true);

    const validMp4 = TranscribeInputSchema.safeParse({
      size: 4096,
      mimeType: 'audio/mp4'
    });
    expect(validMp4.success).toBe(true);

    const handler = createTranscribeHandler({
      enabled: () => true,
      getModels: () => ['gemini-2.5-flash'],
      getApiKey: () => 'fake-key',
      fetchImpl: vi.fn()
    });

    const badForm = new FormData();
    badForm.append(
      'audio',
      new Blob(['hello'], { type: 'text/plain' }),
      'bad.txt'
    );
    badForm.append('mimeType', 'text/plain');

    const badRes = await handler(
      new Request('http://localhost:3000/api/lab/transcribe', {
        method: 'POST',
        body: badForm
      })
    );
    expect(badRes.status).toBe(400);
  });

  test('5. With flag on and >= 2 models in VOICE_LAB_MODELS, returns one transcript per model using the verbatim prompt and survives per-model HTTP/timeout errors', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: 'I dag jeg jobber' }] } }
            ],
            usageMetadata: {
              promptTokenCount: 110,
              candidatesTokenCount: 5
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockRejectedValueOnce(timeoutErr);

    const handler = createTranscribeHandler({
      enabled: () => true,
      getModels: () => ['gemini-2.5-flash', 'bad-model-id', 'slow-model-id'],
      getApiKey: () => 'fake-test-key',
      fetchImpl: mockFetch
    });

    const formData = new FormData();
    formData.append(
      'audio',
      new Blob([new Uint8Array([1, 2, 3, 4])], {
        type: 'audio/webm;codecs=opus'
      }),
      'clip.webm'
    );
    formData.append('mimeType', 'audio/webm;codecs=opus');

    const res = await handler(
      new Request('http://localhost:3000/api/lab/transcribe', {
        method: 'POST',
        body: formData
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(3);
    expect(body[0]).toMatchObject({
      model: 'gemini-2.5-flash',
      transcript: 'I dag jeg jobber',
      inputTokens: 110,
      outputTokens: 5
    });
    expect(body[1]).toMatchObject({
      model: 'bad-model-id',
      transcript: '',
      error: 'HTTP 404'
    });
    expect(body[2]).toMatchObject({
      model: 'slow-model-id',
      transcript: '',
      error: 'timeout'
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const firstCallInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect(firstCallInit.signal).toBeDefined();
    const parsedReqBody = JSON.parse(firstCallInit.body as string);
    expect(parsedReqBody.contents[0].parts[0].text).toBe(
      VERBATIM_TRANSCRIBE_PROMPT
    );
  });
});

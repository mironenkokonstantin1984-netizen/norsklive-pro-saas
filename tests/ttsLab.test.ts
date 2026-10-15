import { describe, expect, it, vi } from 'vitest';
import { AzureTtsAdapter } from '../src/server/tts/azureAdapter';
import { ElevenLabsTtsAdapter } from '../src/server/tts/elevenLabsAdapter';
import { GOOGLE_TTS_EU_ENDPOINT, GoogleTtsAdapter } from '../src/server/tts/googleAdapter';
import { parseTtsLabVoices } from '../src/server/tts/registry';
import { createTtsHandler, MAX_TTS_TEXT_LENGTH } from '../src/server/tts/ttsHandler';

describe('TTS Lab Server Route & Adapters (Issue #52)', () => {
  it('returns 404 when VOICE_LAB_ENABLED is not "true"', async () => {
    const handler = createTtsHandler({ enabled: () => false });
    const req = new Request('http://localhost/api/lab/tts', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'google',
        voice: 'nb-NO-Chirp3-HD-Aoede',
        text: 'Hei, jeg heter Nora.'
      })
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when body is invalid JSON or has invalid fields', async () => {
    const handler = createTtsHandler({ enabled: () => true });

    // Invalid JSON
    const resBadJson = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        body: 'invalid-json{'
      })
    );
    expect(resBadJson.status).toBe(400);

    // Missing text
    const resMissingText = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          voice: 'nb-NO-Chirp3-HD-Aoede'
        })
      })
    );
    expect(resMissingText.status).toBe(400);
    const jsonMissing = (await resMissingText.json()) as { error: string };
    expect(jsonMissing.error).toMatch(/Текст не может быть пустым/);

    // Invalid provider
    const resBadProvider = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'unsupported',
          voice: 'nb-NO-Chirp3-HD-Aoede',
          text: 'Hei'
        })
      })
    );
    expect(resBadProvider.status).toBe(400);
  });

  it('enforces maximum text length of 400 characters', async () => {
    const handler = createTtsHandler({ enabled: () => true });
    const longText = 'a'.repeat(MAX_TTS_TEXT_LENGTH + 1);

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          voice: 'nb-NO-Chirp3-HD-Aoede',
          text: longText
        })
      })
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain('400');
  });

  it('returns 400 with a clear message when provider key is missing', async () => {
    const googleAdapter = new GoogleTtsAdapter(() => '');
    const handler = createTtsHandler({
      enabled: () => true,
      adapters: {
        google: googleAdapter,
        azure: new AzureTtsAdapter(() => ''),
        elevenlabs: new ElevenLabsTtsAdapter(() => '')
      }
    });

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          voice: 'nb-NO-Chirp3-HD-Aoede',
          text: 'Hei'
        })
      })
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain('GOOGLE_TTS_KEY');
  });

  it('synthesizes with Google Cloud TTS EU endpoint and returns audio bytes and headers', async () => {
    const fakeAudioBase64 = Buffer.from('fake-mp3-audio-bytes').toString('base64');
    let capturedUrl = '';
    let capturedHeaders: HeadersInit | undefined;
    let capturedBody = '';

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers;
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ audioContent: fakeAudioBase64 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const googleAdapter = new GoogleTtsAdapter(() => 'test-google-key-12345');
    const handler = createTtsHandler({
      enabled: () => true,
      adapters: {
        google: googleAdapter,
        azure: new AzureTtsAdapter(() => ''),
        elevenlabs: new ElevenLabsTtsAdapter(() => '')
      },
      fetchImpl: mockFetch as unknown as typeof fetch
    });

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          voice: 'nb-NO-Chirp3-HD-Aoede',
          text: 'Velkommen til prøven.'
        })
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(Number(res.headers.get('x-tts-chars'))).toBe('Velkommen til prøven.'.length);
    expect(res.headers.get('x-tts-out-of-eu')).toBe('false');
    expect(Number(res.headers.get('x-tts-latency-ms'))).toBeGreaterThanOrEqual(0);

    const audioBytes = await res.arrayBuffer();
    expect(Buffer.from(audioBytes).toString()).toBe('fake-mp3-audio-bytes');

    expect(capturedUrl).toBe(GOOGLE_TTS_EU_ENDPOINT);
    const headersObj = capturedHeaders as Record<string, string>;
    expect(headersObj['X-Goog-Api-Key']).toBe('test-google-key-12345');
    const bodyParsed = JSON.parse(capturedBody) as {
      input: { text: string };
      voice: { name: string; languageCode: string };
      audioConfig: { audioEncoding: string };
    };
    expect(bodyParsed.input.text).toBe('Velkommen til prøven.');
    expect(bodyParsed.voice.name).toBe('nb-NO-Chirp3-HD-Aoede');
    expect(bodyParsed.voice.languageCode).toBe('nb-NO');
    expect(bodyParsed.audioConfig.audioEncoding).toBe('MP3');
  });

  it('synthesizes with Azure AI Speech (Norway East) and returns audio bytes and headers', async () => {
    let capturedUrl = '';
    let capturedHeaders: HeadersInit | undefined;
    let capturedBody = '';

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers;
      capturedBody = init?.body as string;
      return new Response(Buffer.from('fake-azure-audio'), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' }
      });
    });

    const azureAdapter = new AzureTtsAdapter(
      () => 'azure-test-key',
      () => 'norwayeast'
    );
    const handler = createTtsHandler({
      enabled: () => true,
      adapters: {
        google: new GoogleTtsAdapter(() => ''),
        azure: azureAdapter,
        elevenlabs: new ElevenLabsTtsAdapter(() => '')
      },
      fetchImpl: mockFetch as unknown as typeof fetch
    });

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'azure',
          voice: 'nb-NO-PernilleNeural',
          text: 'Kan du gjenta?'
        })
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-tts-out-of-eu')).toBe('false');
    expect(capturedUrl).toBe('https://norwayeast.tts.speech.microsoft.com/cognitiveservices/v1');
    const headersObj = capturedHeaders as Record<string, string>;
    expect(headersObj['Ocp-Apim-Subscription-Key']).toBe('azure-test-key');
    expect(headersObj['Content-Type']).toBe('application/ssml+xml');
    expect(capturedBody).toContain('<voice xml:lang=\'nb-NO\' name=\'nb-NO-PernilleNeural\'>Kan du gjenta?</voice>');
  });

  it('synthesizes with ElevenLabs and flags isOutOfEu if default US endpoint', async () => {
    let capturedUrl = '';
    let capturedHeaders: HeadersInit | undefined;

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers;
      return new Response(Buffer.from('fake-eleven-audio'), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' }
      });
    });

    const elevenAdapter = new ElevenLabsTtsAdapter(
      () => 'eleven-test-key',
      () => 'https://api.elevenlabs.io/v1'
    );
    const handler = createTtsHandler({
      enabled: () => true,
      adapters: {
        google: new GoogleTtsAdapter(() => ''),
        azure: new AzureTtsAdapter(() => ''),
        elevenlabs: elevenAdapter
      },
      fetchImpl: mockFetch as unknown as typeof fetch
    });

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'elevenlabs',
          voice: '21m00Tcm4TlvDq8ikWAM',
          text: 'Hei'
        })
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-tts-out-of-eu')).toBe('true');
    expect(capturedUrl).toContain('/text-to-speech/21m00Tcm4TlvDq8ikWAM');
    const headersObj = capturedHeaders as Record<string, string>;
    expect(headersObj['xi-api-key']).toBe('eleven-test-key');
  });

  it('never leaks secret keys in error messages', async () => {
    const SECRET_KEY = 'AIzaSySecretKeyNeverLeakThisToAnyone123';
    const mockFetch = vi.fn().mockImplementation(async () => {
      throw new Error(`Connection failed with key ${SECRET_KEY}`);
    });

    const googleAdapter = new GoogleTtsAdapter(() => SECRET_KEY);
    const handler = createTtsHandler({
      enabled: () => true,
      adapters: {
        google: googleAdapter,
        azure: new AzureTtsAdapter(() => ''),
        elevenlabs: new ElevenLabsTtsAdapter(() => '')
      },
      fetchImpl: mockFetch as unknown as typeof fetch
    });

    const res = await handler(
      new Request('http://localhost/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          voice: 'nb-NO-Chirp3-HD-Aoede',
          text: 'Hei'
        })
      })
    );

    expect(res.status).toBe(502);
    const bodyText = await res.text();
    expect(bodyText).not.toContain(SECRET_KEY);
  });

  it('parses TTS_LAB_VOICES correctly', () => {
    const raw =
      'google:nb-NO-Chirp3-HD-Aoede, azure:nb-NO-PernilleNeural, elevenlabs:21m00Tcm4TlvDq8ikWAM, invalid:voice';
    const googleAdapter = new GoogleTtsAdapter(() => 'configured');
    const azureAdapter = new AzureTtsAdapter(() => '');
    const elevenAdapter = new ElevenLabsTtsAdapter(() => 'configured');

    const voices = parseTtsLabVoices(raw, {
      google: googleAdapter,
      azure: azureAdapter,
      elevenlabs: elevenAdapter
    });

    expect(voices).toHaveLength(3);
    expect(voices[0]).toEqual({
      provider: 'google',
      voice: 'nb-NO-Chirp3-HD-Aoede',
      isConfigured: true,
      isOutOfEu: false,
      region: undefined
    });
    expect(voices[1]).toEqual({
      provider: 'azure',
      voice: 'nb-NO-PernilleNeural',
      isConfigured: false,
      isOutOfEu: false,
      region: 'norwayeast'
    });
    expect(voices[2]).toEqual({
      provider: 'elevenlabs',
      voice: '21m00Tcm4TlvDq8ikWAM',
      isConfigured: true,
      isOutOfEu: true,
      region: undefined
    });
  });
});

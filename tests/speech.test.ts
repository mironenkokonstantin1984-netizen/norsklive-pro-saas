// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  VOICES_TIMEOUT_MS,
  VOICE_STORAGE_KEY,
  chooseVoice,
  filterNorwegianVoices,
  getNorwegianVoices,
  getVoiceSnapshot,
  pickBestVoice,
  rankVoices,
  resetVoiceState,
  speakNorwegian,
  splitIntoSpeechChunks
} from '../src/lib/speech';

const NORA = { name: 'Nora', lang: 'nb-NO', localService: true };
const ONLINE = { name: 'Microsoft Pernille Online (Natural)', lang: 'nb-NO', localService: false };
const ESPEAK = { name: 'eSpeak Norwegian', lang: 'nb', localService: true };

describe('voice ranking', () => {
  test('keeps only exact Norwegian tags and understands Android underscores', () => {
    const voices = [
      { name: 'A', lang: 'en-US' },
      { name: 'B', lang: 'nb_NO' },
      { name: 'C', lang: 'nn-NO' },
      { name: 'D', lang: 'no-NO' },
      { name: 'E', lang: 'sv-SE' }
    ];
    expect(filterNorwegianVoices(voices).map((v) => v.name)).toEqual(['B', 'D']);
  });

  test('Nynorsk is only a fallback', () => {
    expect(filterNorwegianVoices([{ name: 'C', lang: 'nn-NO' }]).map((v) => v.name)).toEqual(['C']);
  });

  test('neural cloud voices beat generic ones', () => {
    expect(rankVoices([ESPEAK, NORA, ONLINE])[0]).toBe(ONLINE);
    expect(rankVoices([ESPEAK, NORA])[0]).toBe(NORA);
  });

  test('the remembered voice wins while it exists', () => {
    expect(pickBestVoice([NORA, ONLINE], 'Nora')).toBe(NORA);
    expect(pickBestVoice([NORA, ONLINE], 'Gone')).toBe(ONLINE);
    expect(pickBestVoice([], 'Nora')).toBeNull();
  });
});

describe('sentence splitting', () => {
  test('splits into sentences and keeps offsets into the original text', () => {
    const text = 'Hei! Jeg heter Anna. Hvem er du?';
    const chunks = splitIntoSpeechChunks(text);
    expect(chunks.map((c) => c.text)).toEqual(['Hei!', 'Jeg heter Anna.', 'Hvem er du?']);
    for (const c of chunks) expect(text.slice(c.offset, c.offset + c.text.length)).toBe(c.text);
  });

  test('does not read bracketed notes or Cyrillic remarks', () => {
    const chunks = splitIntoSpeechChunks('Hei. [pause] (привет) Ha det.');
    expect(chunks.map((c) => c.text.replace(/\s+/g, ' ').trim())).toEqual(['Hei.', 'Ha det.']);
  });

  test('cuts a very long sentence into pieces', () => {
    const long = Array.from({ length: 80 }, () => 'ord').join(' ');
    const chunks = splitIntoSpeechChunks(long, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 50)).toBe(true);
  });
});

type Handler = ((e?: unknown) => void) | null;
class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: unknown = null;
  onstart: Handler = null;
  onend: Handler = null;
  onerror: Handler = null;
  onboundary: Handler = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installSynth(initial: unknown[], onSpeak?: (u: FakeUtterance, n: number) => void) {
  let voices = initial;
  const listeners: Array<() => void> = [];
  let spoken = 0;
  const synth = {
    getVoices: () => voices,
    cancel: vi.fn(),
    speak: vi.fn((u: FakeUtterance) => {
      spoken += 1;
      if (onSpeak) onSpeak(u, spoken);
      else {
        u.onstart?.();
        u.onend?.();
      }
    }),
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    }
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: FakeUtterance
  });
  return {
    synth,
    setVoices(next: unknown[]) {
      voices = next;
      listeners.slice().forEach((fn) => fn());
    }
  };
}

describe('getNorwegianVoices and speakNorwegian', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetVoiceState();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetVoiceState();
  });

  test('waits for a late voiceschanged event', async () => {
    const env = installSynth([]);
    const promise = getNorwegianVoices();
    env.setVoices([
      { name: 'Pernille', lang: 'nb-NO' },
      { name: 'Sven', lang: 'sv-SE' }
    ]);
    expect((await promise).map((v) => v.name)).toEqual(['Pernille']);
  });

  test('gives up after the timeout and reports no voice', async () => {
    vi.useFakeTimers();
    installSynth([{ name: 'Sven', lang: 'sv-SE' }]);
    const promise = getNorwegianVoices();
    await vi.advanceTimersByTimeAsync(VOICES_TIMEOUT_MS + 10);
    expect(await promise).toEqual([]);
  });

  test('speaks sentence by sentence with the chosen Norwegian voice', async () => {
    const env = installSynth([NORA, ONLINE]);
    chooseVoice('Nora');
    expect(window.localStorage.getItem(VOICE_STORAGE_KEY)).toBe('Nora');
    const onEnd = vi.fn();
    vi.useFakeTimers();
    const done = speakNorwegian('Hei. Hva heter du?', { onEnd });
    await vi.advanceTimersByTimeAsync(1000);
    await done;
    const calls = env.synth.speak.mock.calls.map((c) => c[0] as FakeUtterance);
    expect(calls.map((u) => u.text)).toEqual(['Hei.', 'Hva heter du?']);
    expect(calls.every((u) => (u.voice as { name: string }).name === 'Nora')).toBe(true);
    expect(env.synth.cancel).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test('retries once after synthesis-failed', async () => {
    const env = installSynth([NORA], (u, n) => {
      if (n === 1) u.onerror?.({ error: 'synthesis-failed' });
      else {
        u.onstart?.();
        u.onend?.();
      }
    });
    const onEnd = vi.fn();
    await speakNorwegian('Hei.', { onEnd });
    expect(env.synth.speak).toHaveBeenCalledTimes(2);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test('without a Norwegian voice nothing is spoken and onNoVoice is called', async () => {
    const env = installSynth([{ name: 'Sven', lang: 'sv-SE' }]);
    vi.useFakeTimers();
    const onNoVoice = vi.fn();
    const done = speakNorwegian('Hei.', { onNoVoice });
    await vi.advanceTimersByTimeAsync(VOICES_TIMEOUT_MS + 10);
    await done;
    expect(onNoVoice).toHaveBeenCalledTimes(1);
    expect(env.synth.speak).not.toHaveBeenCalled();
    expect(getVoiceSnapshot().status).toBe('none');
  });
});

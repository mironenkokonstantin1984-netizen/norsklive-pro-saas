// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';
import { MIC_MESSAGES } from '../src/lib/useSpeechRecognition';
import { PREFS_STORAGE_KEY } from '../src/lib/prefs';

type ResultLike = { 0: { transcript: string }; length: number; isFinal: boolean };

/** A fake browser recognizer that the test drives by hand. */
class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  interimResults = false;
  continuous = false;
  onstart: (() => void) | null = null;
  onresult: ((e: { resultIndex: number; results: ResultLike[] }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  startCalls = 0;
  stopCalls = 0;
  private results: ResultLike[] = [];

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.results = [];
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
    this.onend?.();
  }

  /** The browser heard something; `final` marks the end of a phrase. */
  hear(text: string, final = true) {
    const last = this.results[this.results.length - 1];
    if (last && !last.isFinal) this.results.pop();
    this.results.push({ 0: { transcript: text }, length: 1, isFinal: final });
    this.onresult?.({ resultIndex: this.results.length - 1, results: [...this.results] });
  }

  /** The browser ended the session by itself (pause, time limit). */
  endBySelf() {
    this.onend?.();
  }

  fail(code: string) {
    this.onerror?.({ error: code });
    this.onend?.();
  }
}

function recognizer() {
  return FakeRecognition.instances[FakeRecognition.instances.length - 1];
}

function setup() {
  const utils = render(<StudioPage />);
  const mic = utils.container.querySelector('#micToggleBtn') as HTMLButtonElement;
  const input = utils.container.querySelector('#userSpeechInput') as HTMLInputElement;
  const status = utils.container.querySelector('#micStatusText') as HTMLElement;
  return { ...utils, mic, input, status };
}

describe('#46 recording until «Готово»', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    FakeRecognition.instances = [];
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    globalThis.fetch = originalFetch;
    cleanup();
    vi.useRealTimers();
  });

  test('uses continuous nb-NO recognition with interim results', () => {
    setup();
    expect(recognizer().lang).toBe('nb-NO');
    expect(recognizer().continuous).toBe(true);
    expect(recognizer().interimResults).toBe(true);
  });

  test('pauses do not end the recording: the browser session restarts and the text is joined', () => {
    const { mic, input, container } = setup();
    fireEvent.click(mic);
    const rec = recognizer();

    act(() => rec.hear('Jeg heter Anna'));
    act(() => rec.endBySelf()); // pause
    expect(rec.startCalls).toBe(2);
    expect(mic.getAttribute('aria-pressed')).toBe('true');

    act(() => rec.hear('og jeg bor', false));
    expect(container.querySelector('#micLiveText')?.textContent).toBe('Jeg heter Anna og jeg bor');
    act(() => rec.hear('og jeg bor i Bergen'));
    act(() => rec.endBySelf()); // another pause
    expect(rec.startCalls).toBe(3);

    fireEvent.click(mic); // «Готово»
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    expect(input.value).toBe('Jeg heter Anna og jeg bor i Bergen');
    expect(container.querySelector('#micLiveText')).toBeNull();
  });

  test('a 30-second recording with 5-second pauses stays one recording and one text', () => {
    vi.useFakeTimers();
    const { mic, input } = setup();
    fireEvent.click(mic);
    const rec = recognizer();
    const phrases = ['Jeg heter Anna.', 'Jeg bor i Bergen.', 'Jeg jobber på et sykehus.'];

    for (let second = 0; second < 30; second += 5) {
      const phrase = phrases[(second / 5) % phrases.length];
      act(() => rec.hear(phrase));
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      act(() => rec.endBySelf()); // the browser ends the session at the pause
      expect(mic.getAttribute('aria-pressed')).toBe('true');
    }

    fireEvent.click(mic);
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    expect(input.value).toBe([...phrases, ...phrases].join(' '));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a phone browser that ends the session after every phrase does not cut the learner off', () => {
    const { mic, input } = setup();
    fireEvent.click(mic);
    const rec = recognizer();
    const words = ['En', 'to', 'tre', 'fire', 'fem', 'seks'];
    for (const word of words) {
      act(() => rec.hear(word));
      act(() => rec.endBySelf());
    }
    expect(mic.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(mic);
    expect(input.value).toBe(words.join(' '));
  });

  test('nothing is sent until «Отправить» by default', () => {
    const { mic, input, container } = setup();
    fireEvent.click(mic);
    act(() => recognizer().hear('Jeg liker å lese'));
    fireEvent.click(mic);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(input.value).toBe('Jeg liker å lese');
    expect(container.querySelectorAll('#chatStream .msg-user')).toHaveLength(0);
  });

  test('with «Отправлять сразу после «Готово»» on, the text is sent at once', () => {
    window.localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({ textSize: 'sm', tempo: 1, subtitles: true, contrast: false, autoSend: true })
    );
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    const { mic, input, container } = setup();
    fireEvent.click(mic);
    act(() => recognizer().hear('Jeg liker å lese'));
    fireEvent.click(mic);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
    expect(container.querySelectorAll('#chatStream .msg-user')).toHaveLength(1);
  });

  test('restart-loop guard: more than 3 quick empty restarts stop the recording with a message', () => {
    const { mic, status, input } = setup();
    fireEvent.click(mic);
    const rec = recognizer();
    act(() => rec.hear('Hei'));
    act(() => rec.endBySelf());
    act(() => rec.endBySelf());
    act(() => rec.endBySelf());
    expect(mic.getAttribute('aria-pressed')).toBe('true');
    act(() => rec.endBySelf());

    expect(rec.startCalls).toBe(4);
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    expect(status.textContent).toBe(MIC_MESSAGES.tooManyRestarts);
    expect(input.value).toBe('Hei');
  });

  test.each([
    ['not-allowed', MIC_MESSAGES.notAllowed],
    ['service-not-allowed', MIC_MESSAGES.notAllowed],
    ['audio-capture', MIC_MESSAGES.audioCapture],
    ['network', MIC_MESSAGES.network]
  ])('hard error %s stops without restarting and shows a plain message', (code, message) => {
    const { mic, status } = setup();
    fireEvent.click(mic);
    const rec = recognizer();
    act(() => rec.fail(code));

    expect(rec.startCalls).toBe(1);
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    expect(status.textContent).toBe(message);
    expect(status.textContent).not.toContain(code);
  });

  test('no speech at all shows «Не слышно речи»', () => {
    const { mic, status } = setup();
    fireEvent.click(mic);
    const rec = recognizer();
    act(() => rec.onerror?.({ error: 'no-speech' }));
    fireEvent.click(mic);
    expect(status.textContent).toBe(MIC_MESSAGES.noSpeech);
  });

  test('the error message stays until the next attempt', () => {
    const { mic, status } = setup();
    fireEvent.click(mic);
    act(() => recognizer().fail('audio-capture'));
    expect(status.textContent).toBe(MIC_MESSAGES.audioCapture);
    fireEvent.click(mic);
    expect(status.textContent).not.toBe(MIC_MESSAGES.audioCapture);
  });

  test('the recording timer counts up while recording', () => {
    vi.useFakeTimers();
    const { mic, container } = setup();
    fireEvent.click(mic);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(container.querySelector('#micRecordingTimer')?.textContent).toBe('0:03 / 2:00');
  });

  test('a browser without recognition shows an in-page message, no alert(), and focuses the text field', () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { mic, status, input } = setup();
    fireEvent.click(mic);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(status.textContent).toBe(MIC_MESSAGES.unsupported);
    expect(document.activeElement).toBe(input);
    alertSpy.mockRestore();
  });

  test('no emoji or raw codes in the mic messages', () => {
    for (const message of Object.values(MIC_MESSAGES)) {
      expect(message).not.toMatch(/[☀-➿⭐✅]|[\u{1F300}-\u{1FAFF}]/u);
      expect(message).not.toMatch(/not-allowed|no-speech|audio-capture|ASR/);
    }
  });
});

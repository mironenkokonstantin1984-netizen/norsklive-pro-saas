// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TtsLabTab, {
  exportRatingsToCsv,
  loadTtsRatings,
  TEST_SENTENCES
} from '../src/app/lab/voice/TtsLabTab';
import VoiceLabClient from '../src/app/lab/voice/VoiceLabClient';
import * as speechModule from '../src/lib/speech';
import type { TtsVoiceInfo } from '../src/server/tts/types';

describe('TTS Lab UI & Ratings (Issue #52)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-audio');
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-audio');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all 12 Norwegian test sentences and switches sentence on click', () => {
    render(<TtsLabTab ttsVoices={[]} />);

    expect(TEST_SENTENCES).toHaveLength(12);

    for (const item of TEST_SENTENCES) {
      expect(screen.getAllByText(item.text).length).toBeGreaterThanOrEqual(1);
    }

    const textarea = screen.getByLabelText(/Текст для озвучивания/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe(TEST_SENTENCES[0].text);

    // Click sentence #2
    fireEvent.click(screen.getByText(TEST_SENTENCES[1].text));
    expect(textarea.value).toBe(TEST_SENTENCES[1].text);
  });

  it('shows browser baseline and calm notice when no neural provider keys are set', () => {
    render(<TtsLabTab ttsVoices={[]} />);

    expect(
      screen.getByText(/Сравнение нейроголосов: эталон браузера активен/i)
    ).toBeDefined();
    expect(screen.getByText(/GOOGLE_TTS_KEY/i)).toBeDefined();
    expect(screen.getByText(/AZURE_SPEECH_KEY/i)).toBeDefined();
    expect(screen.getByText(/ELEVENLABS_API_KEY/i)).toBeDefined();

    const voiceSelect = screen.getByLabelText(/Голос для синтеза/i) as HTMLSelectElement;
    expect(voiceSelect.options).toHaveLength(1);
    expect(voiceSelect.options[0].text).toContain('Браузер: Web Speech API');
  });

  it('synthesizes with browser speech and displays generated clip card with latency', async () => {
    const speakSpy = vi
      .spyOn(speechModule, 'speakNorwegian')
      .mockImplementation(async (_text, opts) => {
        opts?.onStart?.();
        opts?.onEnd?.();
      });

    render(<TtsLabTab ttsVoices={[]} />);

    const synthesizeBtn = screen.getByRole('button', {
      name: /Сгенерировать и воспроизвести/i
    });
    fireEvent.click(synthesizeBtn);

    expect(speakSpy).toHaveBeenCalledWith(
      TEST_SENTENCES[0].text,
      expect.objectContaining({ rate: 1.0 })
    );

    const clipCard = await screen.findByTestId('ttsClipCard');
    expect(clipCard).toBeDefined();
    expect(clipCard.textContent).toContain('Браузер');
    expect(clipCard.textContent).toContain(TEST_SENTENCES[0].text);
  });

  it('synthesizes neural voice via /api/lab/tts, shows latency, chars, and out-of-EU badge', async () => {
    const mockTtsVoices: TtsVoiceInfo[] = [
      {
        provider: 'google',
        voice: 'nb-NO-Chirp3-HD-Aoede',
        isConfigured: true,
        isOutOfEu: false
      },
      {
        provider: 'elevenlabs',
        voice: '21m00Tcm4TlvDq8ikWAM',
        isConfigured: true,
        isOutOfEu: true
      }
    ];

    const fakeBlob = new Blob(['fake-audio-bytes'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Type': 'audio/mpeg',
        'x-tts-latency-ms': '185',
        'x-tts-chars': '53',
        'x-tts-out-of-eu': 'true'
      }),
      blob: async () => fakeBlob
    }) as unknown as typeof fetch;

    // Mock Audio
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    render(<TtsLabTab ttsVoices={mockTtsVoices} />);

    // Select ElevenLabs voice (out of EU)
    const select = screen.getByLabelText(/Голос для синтеза/i);
    fireEvent.change(select, { target: { value: 'elevenlabs:21m00Tcm4TlvDq8ikWAM' } });

    expect(screen.getByRole('note')).toBeDefined();

    const synthesizeBtn = screen.getByRole('button', {
      name: /Сгенерировать и воспроизвести/i
    });
    fireEvent.click(synthesizeBtn);

    const clipCard = await screen.findByTestId('ttsClipCard');
    expect(clipCard.textContent).toContain('ElevenLabs');
    expect(clipCard.textContent).toContain('185 мс');
    expect(clipCard.textContent).toContain('53 симв.');
    expect(clipCard.textContent).toContain('регион вне ЕС, только для сравнения');
  });

  it('stores ratings (naturalness, clarity, note) in localStorage and updates stats', async () => {
    vi.spyOn(speechModule, 'speakNorwegian').mockResolvedValue(undefined);

    render(<TtsLabTab ttsVoices={[]} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Сгенерировать и воспроизвести/i })
    );

    await screen.findByTestId('ttsClipCard');

    // Rate naturalness = 4
    fireEvent.click(screen.getByRole('button', { name: 'Оценка естественности 4' }));
    // Rate clarity = 5
    fireEvent.click(screen.getByRole('button', { name: 'Оценка понятности 5' }));
    // Add note
    const noteInput = screen.getByPlaceholderText(/хорошая интонация/i);
    fireEvent.change(noteInput, { target: { value: 'Отличное произношение' } });

    const stored = loadTtsRatings();
    const clipKey = Object.keys(stored)[0];
    expect(stored[clipKey].naturalness).toBe(4);
    expect(stored[clipKey].clarity).toBe(5);
    expect(stored[clipKey].note).toBe('Отличное произношение');

    // Check stats table
    expect(screen.getByText(/Сводка оценок по провайдерам и голосам/i)).toBeDefined();
    expect(screen.getByText('4.0')).toBeDefined();
    expect(screen.getByText('5.0')).toBeDefined();
  });

  it('exports ratings correctly formatted as CSV', () => {
    const ratingsMap = {
      'clip-1': {
        clipId: 'clip-1',
        provider: 'google',
        voice: 'nb-NO-Chirp3-HD-Aoede',
        sentenceId: 'greeting',
        naturalness: 5,
        clarity: 4,
        latencyMs: 140,
        charCount: 45,
        note: 'Приятный голос, натурально',
        updatedAt: 123456789
      }
    };

    const csv = exportRatingsToCsv(ratingsMap);
    expect(csv).toContain('provider,voice,sentence_id,naturalness,clarity,latency_ms,chars,note');
    expect(csv).toContain('google,nb-NO-Chirp3-HD-Aoede,greeting,5,4,140,45,"Приятный голос, натурально"');
  });

  it('renders cost calculator and updates session cost based on character count', () => {
    render(<TtsLabTab ttsVoices={[]} />);

    expect(screen.getByText(/Оценка стоимости и калькулятор сессии/i)).toBeDefined();
    expect(screen.getByText(/не более 25 kr/i)).toBeDefined();

    const charsInput = screen.getByLabelText(/Символов речи экзаменатора/i) as HTMLInputElement;
    expect(charsInput.value).toBe('1500');

    // With 1500 chars:
    // Google: (1500/1M) * 16 * 10.5 = 0.25 kr
    expect(screen.getByText('0.25 kr')).toBeDefined();
    // Azure: (1500/1M) * 15 * 10.5 = 0.24 kr
    expect(screen.getByText('0.24 kr')).toBeDefined();

    // Change chars to 3000
    fireEvent.change(charsInput, { target: { value: '3000' } });
    // Google: (3000/1M) * 16 * 10.5 = 0.50 kr
    expect(screen.getByText('0.50 kr')).toBeDefined();
  });

  it('switches between STT and TTS tabs in VoiceLabClient', () => {
    render(
      <VoiceLabClient
        configuredModels={['gemini-2.5-flash']}
        ttsVoices={[]}
      />
    );

    // Initial tab is STT
    expect(screen.getByText(/Record Clip/i)).toBeDefined();

    // Switch to TTS tab
    const ttsTabBtn = screen.getByRole('tab', { name: /Синтез речи \(TTS\)/i });
    fireEvent.click(ttsTabBtn);

    expect(screen.getByText(/12 тестовых предложений/i)).toBeDefined();
    expect(screen.getByText(/Синтез и воспроизведение/i)).toBeDefined();
  });
});

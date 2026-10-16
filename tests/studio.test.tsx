// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';

const MOCK_COACH_RESPONSE = {
  reply_norsk: 'Flott svar! Hva tenker du om langsiktige konsekvenser?',
  reply_l1: 'Отличный ответ! Что ты думаешь о долгосрочных последствиях?',
  correction: {
    original: 'I dag jeg liker kaffe',
    natural_bokmal: 'I dag liker jeg kaffe',
    b2_upgrade: 'I arbeidshverdagen setter jeg stor pris på en god kopp kaffe.',
    grammar_rule_l1: 'После обстоятельства «I dag» глагол стоит на 2-м месте (V2).',
    cefr_estimate: 'A2',
    v2_status: '⚠️ Pass på V2-inversjon',
    samhandling_status: '✓ Samhandling OK'
  },
  next_hints: [
    {
      label: 'Новая B2-подсказка',
      norsk: 'På den annen side fremmer dette inkludering.',
      ru: 'С другой стороны, это способствует интеграции.'
    }
  ]
};

describe('StudioPage (/ and /studio) M1a-3 Full UI, Chat & Voice', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  test('1. Module tabs and materials drawer are removed in favor of topic sheet (R4)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#moduleTabs')).toBeNull();
    expect(container.querySelector('button[data-module="jobbintervju"]')).toBeNull();
    expect(container.querySelector('button[data-module="pensum"]')).toBeNull();
    expect(container.querySelector('#materialsDrawer')).toBeNull();
  });

  test('2. Target words panel and vocab bingo are removed from studio (R4)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#vocabBingoList')).toBeNull();
  });

  test('3. Custom source textarea is removed from studio (R4, moved to TopicSheet)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#customSourceTextarea')).toBeNull();
    expect(container.querySelector('#applyCustomSourceBtn')).toBeNull();
  });

  test('4. Target words glossary chip is removed from studio (R4, moved to /words)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#vocabBingoList')).toBeNull();
    expect(container.querySelector('#savedWordsCount')).toBeNull();
  });

  test('5 (a). Typing a phrase and pressing "Отправить" posts expected body to /api/coach and renders user bubble, AI bubble, coaching card, and hints', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => MOCK_COACH_RESPONSE
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);

    const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
    const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'I dag jeg liker kaffe' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe('/api/coach');
    expect(calledInit.method).toBe('POST');
    const sentBody = JSON.parse(String(calledInit.body));
    expect(sentBody).toMatchObject({
      module: 'norskprove',
      scenarioId: 'np-b1-presentation-arbeid',
      level: 'B1',
      l1: 'ru',
      persona: 'standard',
      userText: 'I dag jeg liker kaffe'
    });
    expect(Array.isArray(sentBody.history)).toBe(true);

    await waitFor(() => {
      const chatText = container.querySelector('#chatStream')?.textContent || '';
      expect(chatText).toContain('I dag jeg liker kaffe');
      expect(chatText).toContain(MOCK_COACH_RESPONSE.reply_norsk);
      expect(chatText).toContain(MOCK_COACH_RESPONSE.reply_l1);
    });

    const coachingCards = container.querySelectorAll('#chatStream .correction-card');
    expect(coachingCards.length).toBe(1);
    expect(coachingCards[0]?.textContent).toContain(MOCK_COACH_RESPONSE.correction.grammar_rule_l1);
    expect(coachingCards[0]?.textContent).toContain(MOCK_COACH_RESPONSE.correction.b2_upgrade);
  });

  test('6 (b). Server error keeps the user bubble and shows the «Повторить» card, with no canned correction', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal error' })
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);

    const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
    const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hei på deg!' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="coachErrorCard"]')).not.toBeNull();
    });
    expect(container.querySelector('[data-testid="coachErrorCard"]')?.textContent).toContain(
      'Не получилось получить ответ. Ваш ответ сохранён.'
    );
    expect(container.querySelector('#micStatusText')?.textContent || '').not.toContain('HTTP 500');

    const userBubbles = container.querySelectorAll('#chatStream .msg-user');
    expect(userBubbles.length).toBe(1);
    expect(userBubbles[0]?.textContent).toContain('Hei på deg!');
    expect(container.querySelectorAll('#chatStream .msg-ai').length).toBe(1);
    expect(container.querySelector('#chatStream .correction-card')).toBeNull();
  });

  test('7 (c). Response containing "<img src=x onerror=alert(1)>" in reply_norsk is rendered as literal text (no img element in DOM)', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ...MOCK_COACH_RESPONSE,
        reply_norsk: xssPayload
      })
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);

    const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
    const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Test XSS' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const chatText = container.querySelector('#chatStream')?.textContent || '';
      expect(chatText).toContain(xssPayload);
    });

    expect(container.querySelector('img')).toBeNull();
  });

  test('8 (d). Drawer hints container is removed from studio (R4)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#hintsContainer')).toBeNull();
  });

  test('9 (e). Vocab bingo list is removed from studio (R4)', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#vocabBingoList')).toBeNull();
  });

  test('10 (M1c-1, #46). MicButton label changes with recording state ("Snakk" -> "Готово" -> "Snakk")', async () => {
    class MockSpeechRecognition {
      lang = 'nb-NO';
      interimResults = true;
      continuous = true;
      onstart: (() => void) | null = null;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        this.onstart?.();
      }
      stop() {
        this.onend?.();
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = MockSpeechRecognition;

    const { container } = render(<StudioPage />);
    const micBtn = container.querySelector('#micToggleBtn') as HTMLButtonElement;
    const statusEl = container.querySelector('#micStatusText') as HTMLElement;
    const inputEl = container.querySelector('#userSpeechInput') as HTMLInputElement;
    expect(micBtn).toBeTruthy();
    expect(micBtn.getAttribute('aria-pressed')).toBe('false');
    expect(micBtn.textContent).toContain('Snakk');
    expect(statusEl.textContent).toBe('Нажмите и говорите');
    expect(inputEl.getAttribute('placeholder')).toBe('Или напишите ответ');

    fireEvent.click(micBtn);
    expect(micBtn.getAttribute('aria-pressed')).toBe('true');
    expect(micBtn.textContent).toContain('Готово');
    expect(micBtn.getAttribute('aria-label')).toBe('Готово');
    expect(statusEl.textContent).toBe('Говорите. Нажмите «Готово», когда закончите.');
    expect(container.querySelector('#micRecordingTimer')?.textContent).toBe('0:00 / 2:00');
    expect(container.querySelector('#micRecordingTimer')).toBeTruthy();

    fireEvent.click(micBtn);
    expect(micBtn.getAttribute('aria-pressed')).toBe('false');
    expect(micBtn.textContent).toContain('Snakk');
    expect(statusEl.textContent).toBe('Нажмите и говорите');

    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  test('11 (M1c-1, R4). Materials toggle button and drawer are removed from studio', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#materialsToggleBtn')).toBeNull();
    expect(container.querySelector('#materialsDrawer')).toBeNull();
  });

  test('12 (M1c-1). src/app/studio/studio.css contains zero hardcoded hex/rgb colors or px font-size declarations', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssPath = path.resolve(process.cwd(), 'src/app/studio/studio.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).not.toMatch(/#[0-9a-fA-F]{3,8}|rgb|font-size: *[0-9]+px/);
  });

  test('13 (#49). Submitting a correct sentence renders status: ok, praise, no strike-through, and keeps input enabled', async () => {
    const mockOkResponse = {
      reply_norsk: 'Det er et godt synspunkt! Hva gjør du selv for miljøet i hverdagen?',
      reply_l1: 'Это хорошая точка зрения! А что ты сам делаешь для экологии в повседневной жизни?',
      feedback: {
        status: 'ok',
        errors: [],
        praise_l1: 'Kjempebra! Setningen er grammatisk helt korrekt.',
        level_estimate: 'A2'
      },
      next_hints: [
        {
          label: 'Følge opp (A2)',
          norsk: 'Jeg prøver å kildesortere og ta bussen.',
          ru: 'Я стараюсь сортировать мусор и ездить на автобусе.'
        }
      ]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOkResponse
    } as unknown as Response);

    const { container } = render(<StudioPage />);

    const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
    const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

    const sentence = 'Jeg tenker at miljø er viktig fordi jeg bor i Oslo.';
    fireEvent.change(input, { target: { value: sentence } });
    fireEvent.click(sendBtn);

    // User bubble appears in chatStream
    await waitFor(() => {
      const chatText = container.querySelector('#chatStream')?.textContent || '';
      expect(chatText).toContain(sentence);
      expect(chatText).toContain('Det er et godt synspunkt!');
    });

    // Coach card shows «Хорошо!» with praise
    await waitFor(() => {
      expect(container.querySelector('[data-testid="correctionOk"]')?.textContent).toBe('Хорошо!');
      expect(container.querySelector('.correction-praise')?.textContent).toBe(
        'Kjempebra! Setningen er grammatisk helt korrekt.'
      );
    });

    // Zero struck-out text (no <del> tags anywhere in container)
    const delTags = container.querySelectorAll('del');
    expect(delTags.length).toBe(0);

    // Input stays enabled for next turn
    expect(input.disabled).toBe(false);
    expect(sendBtn.disabled).toBe(false);
  });
});

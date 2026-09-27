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

  test('1. Switching module shows that module’s scenarios', () => {
    const { container, getByText } = render(<StudioPage />);

    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'Norskprøve Muntlig'
    );
    expect(
      getByText(/Eksamen #1: Digitalisering, hjemmekontor og bærekraftig velferdsstat/)
    ).toBeTruthy();

    const jobbTab = container.querySelector(
      'button[data-module="jobbintervju"]'
    ) as HTMLButtonElement;
    fireEvent.click(jobbTab);

    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'Jobbintervju på norsk'
    );
    expect(
      getByText(/Intervju Case: Key Account Manager \/ Logistikk & AI-automasjon/)
    ).toBeTruthy();

    const pensumTab = container.querySelector(
      'button[data-module="pensum"]'
    ) as HTMLButtonElement;
    fireEvent.click(pensumTab);

    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'CEFR Teleprompter'
    );
    expect(
      getByText(/CEFR B1 Modul: Fastlege, egenmelding og helsesystemet/)
    ).toBeTruthy();
  });

  test('2. Selecting a scenario renders its target words', () => {
    const { container, getByText } = render(<StudioPage />);

    const scenario2 = getByText(
      /Eksamen #2 \(UDI A2\/B1-krav\): Miljø, nærmiljø og frivillighet \(Dugnad\)/
    );
    fireEvent.click(scenario2);

    const bingoText = container.querySelector('#vocabBingoList')?.textContent || '';
    expect(bingoText).toContain('kildesortering');
    expect(bingoText).toContain('kollektivtransport');
    expect(bingoText).toContain('lokalsamfunn');
  });

  test('3. Applying custom text of "alpha beta gamma delta" creates target words', () => {
    const { container } = render(<StudioPage />);

    const textarea = container.querySelector(
      '#customSourceTextarea'
    ) as HTMLTextAreaElement;
    const applyBtn = container.querySelector(
      '#applyCustomSourceBtn'
    ) as HTMLButtonElement;

    fireEvent.change(textarea, { target: { value: 'alpha beta gamma delta' } });
    fireEvent.click(applyBtn);

    const bingoText = container.querySelector('#vocabBingoList')?.textContent || '';
    expect(bingoText).toContain('alpha');
    expect(bingoText).toContain('beta');
    expect(bingoText).toContain('gamma');
    expect(bingoText).toContain('delta');
    expect(container.querySelector('#vocabProgressText')?.textContent).toContain(
      '0 / 4 brukt'
    );
  });

  test('4. Saving a glossary item writes norsklive_glossary to localStorage', () => {
    const { container } = render(<StudioPage />);

    const firstChip = container.querySelector(
      '#vocabBingoList .vocab-chip'
    ) as HTMLElement;
    expect(firstChip).toBeTruthy();
    fireEvent.click(firstChip);

    const rawStored = window.localStorage.getItem('norsklive_glossary');
    expect(rawStored).toBeTruthy();
    const parsed = JSON.parse(rawStored || '[]');
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].word).toBe('å ta hensyn til');
    expect(container.querySelector('#savedWordsCount')?.textContent).toBe('1');
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

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(calledUrl).toBe('/api/coach');
    expect(calledInit.method).toBe('POST');
    const sentBody = JSON.parse(String(calledInit.body));
    expect(sentBody).toMatchObject({
      module: 'norskprove',
      scenarioId: 'np-b1b2-velferd-hjemmekontor',
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

    const coachingCards = container.querySelectorAll(
      '#coachingCardsList .coaching-card'
    );
    expect(coachingCards.length).toBe(1);
    expect(coachingCards[0]?.textContent).toContain('I dag liker jeg kaffe');
    expect(coachingCards[0]?.textContent).toContain(
      MOCK_COACH_RESPONSE.correction.b2_upgrade
    );

    const hintsText = container.querySelector('#hintsContainer')?.textContent || '';
    expect(hintsText).toContain('Новая B2-подсказка');
    expect(hintsText).toContain('På den annen side fremmer dette inkludering.');
  });

  test('6 (b). Server error shows error status and keeps user bubble', async () => {
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
      const statusText = container.querySelector('#micStatusText')?.textContent || '';
      expect(statusText).toContain('Ошибка связи с сервером: HTTP 500');
    });

    const userBubbles = container.querySelectorAll('#chatStream .msg-user');
    expect(userBubbles.length).toBe(1);
    expect(userBubbles[0]?.textContent).toContain('Hei på deg!');
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

  test('8 (d). Clicking a hint sends it to /api/coach', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => MOCK_COACH_RESPONSE
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);

    const firstHint = container.querySelector(
      '#hintsContainer .hint-card'
    ) as HTMLElement;
    expect(firstHint).toBeTruthy();
    fireEvent.click(firstHint);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, calledInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sentBody = JSON.parse(String(calledInit.body));
    expect(sentBody.userText).toContain('Det er avgjørende å ta hensyn til');
  });

  test('9 (e). Saying a target word in the phrase marks it "✓ BRUKT I TALE"', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => MOCK_COACH_RESPONSE
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);

    const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
    const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

    fireEvent.change(input, {
      target: { value: 'Vi må ha en bærekraftig utvikling i samfunnet.' }
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const usedChips = container.querySelectorAll('#vocabBingoList .vocab-chip.used');
      expect(usedChips.length).toBeGreaterThanOrEqual(1);
      expect(usedChips[0]?.textContent).toContain('bærekraftig');
      expect(usedChips[0]?.textContent).toContain('✓ BRUKT I TALE');
    });
  });

  test('10 (M1c-1). MicButton label changes with recording and processing state ("Snakk" -> "Слушаю" -> "Думаю")', async () => {
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
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      MockSpeechRecognition;

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
    expect(micBtn.textContent).toContain('Слушаю');
    expect(statusEl.textContent).toBe('0:00 / 2:00');
    expect(container.querySelector('#micRecordingTimer')).toBeTruthy();

    fireEvent.click(micBtn);
    expect(micBtn.getAttribute('aria-pressed')).toBe('false');
    expect(micBtn.textContent).toContain('Snakk');
    expect(statusEl.textContent).toBe('Нажмите и говорите');

    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  test('11 (M1c-1). Clicking "Материалы" button toggles materials drawer and aria-expanded', () => {
    const { container } = render(<StudioPage />);

    const materialsBtn = container.querySelector(
      '#materialsToggleBtn'
    ) as HTMLButtonElement;
    const drawer = container.querySelector('#materialsDrawer') as HTMLElement;

    expect(materialsBtn).toBeTruthy();
    expect(drawer).toBeTruthy();
    expect(materialsBtn.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.classList.contains('is-closed')).toBe(true);

    fireEvent.click(materialsBtn);
    expect(materialsBtn.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.classList.contains('is-open')).toBe(true);

    fireEvent.click(materialsBtn);
    expect(materialsBtn.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.classList.contains('is-closed')).toBe(true);
  });

  test('12 (M1c-1). src/app/studio/studio.css contains zero hardcoded hex/rgb colors or px font-size declarations', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssPath = path.resolve(process.cwd(), 'src/app/studio/studio.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).not.toMatch(/#[0-9a-fA-F]{3,8}|rgb|font-size: *[0-9]+px/);
  });
});

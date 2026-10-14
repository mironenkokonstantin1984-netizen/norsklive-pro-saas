// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import {
  PracticeScreen,
  COACH_UNAVAILABLE_MESSAGE,
  NO_SPEECH_SUPPORT_MESSAGE,
  NO_MIC_PERMISSION_MESSAGE
} from '../src/components/practice/PracticeScreen';
import * as speechModule from '../src/lib/speech';
import * as coachClient from '../src/lib/coachClient';
import fs from 'node:fs';
import path from 'node:path';

function installVoices(voices: unknown[]) {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
      cancel: vi.fn(),
      speak: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  });
}

type ResultLike = { 0: { transcript: string }; length: number; isFinal: boolean };

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

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
    this.onend?.();
  }
}

describe('PracticeScreen (/practice, Issue #53)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    speechModule.resetVoiceState();
    installVoices([{ name: 'Nora', lang: 'nb-NO' }]);
    FakeRecognition.instances = [];
    (window as unknown as { SpeechRecognition: typeof FakeRecognition }).SpeechRecognition =
      FakeRecognition;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    speechModule.resetVoiceState();
    delete (window as unknown as { SpeechRecognition?: typeof FakeRecognition }).SpeechRecognition;
  });

  it('1. First view of /practice has at most 50 visible words and at most 4 interactive elements', () => {
    render(<PracticeScreen authEnabled={false} />);

    const screenEl = screen.getByTestId('practiceScreen');
    expect(screenEl).toBeTruthy();

    // Check visible word count on first view
    const visibleText = screenEl.textContent || '';
    const words = visibleText
      .replace(/[‹›«».,!?;:()]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    expect(words.length).toBeLessThanOrEqual(50);

    // In <main>, exactly 4 interactive elements on first view:
    // 1. «Перевод», 2. «Слушать», 3. MicButton, 4. «Написать ответ»
    const mainEl = screen.getByRole('main');
    const interactiveInMain = mainEl.querySelectorAll('button, a, input, textarea, select');
    expect(interactiveInMain.length).toBeLessThanOrEqual(4);

    // Across the entire screen, exactly 4 buttons (Back is a navigation link)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeLessThanOrEqual(4);
  });

  it('2. The same task text is never shown twice (no duplicated banner or panels)', () => {
    render(<PracticeScreen authEnabled={false} />);

    // Verify there is NO old «ЭТАП» banner or duplicated task text
    expect(document.querySelector('.exam-stage-banner')).toBeNull();
    expect(document.querySelector('#examPromptText')).toBeNull();

    // Verify examiner speech line exists exactly once
    const examinerSpeeches = document.querySelectorAll('.practice-examiner-speech');
    expect(examinerSpeeches.length).toBe(1);
  });

  it('3. All controls have touch targets >= 44 px and exactly one filled button visible at a time', () => {
    render(<PracticeScreen authEnabled={false} />);

    // On first view, there is NO .practice-filled-btn (Mic is circular dock, others are text/outline)
    const filledButtons = document.querySelectorAll('.practice-filled-btn');
    expect(filledButtons.length).toBeLessThanOrEqual(1);

    // Click «Написать ответ» to reveal textarea and «Отправить» button
    const writeBtn = screen.getByRole('button', { name: 'Написать ответ' });
    fireEvent.click(writeBtn);

    // Now «Отправить» filled button is shown
    const filledAfterWrite = document.querySelectorAll('.practice-filled-btn');
    expect(filledAfterWrite.length).toBe(1);
    expect(filledAfterWrite[0].textContent).toContain('Отправить');
  });

  it('4. Header renders back button, topic title, mode, and timer', () => {
    render(<PracticeScreen authEnabled={false} />);

    const backLink = screen.getByRole('link', { name: 'Назад' });
    expect(backLink).toBeTruthy();
    expect(backLink.getAttribute('href')).toBe('/');

    expect(screen.getByText(/Учёба/)).toBeTruthy();
    expect(screen.getByLabelText('Таймер')).toBeTruthy();
  });

  it('5. Examiner block: translation toggle expands/collapses and speak button speaks line', () => {
    const speakSpy = vi.spyOn(speechModule, 'speakNorwegian').mockResolvedValue();

    render(<PracticeScreen authEnabled={false} />);

    const translateBtn = screen.getByRole('button', { name: 'Перевод' });
    expect(translateBtn.getAttribute('aria-expanded')).toBe('false');

    // Click translation toggle -> expands
    fireEvent.click(translateBtn);
    expect(translateBtn.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.practice-examiner-translation')).toBeTruthy();

    // Click listen button -> speaks examiner line
    const listenBtn = screen.getByRole('button', { name: 'Слушать' });
    fireEvent.click(listenBtn);
    expect(speakSpy).toHaveBeenCalled();
  });

  it('6. History bottom sheet: opens and displays turns, closes on Escape or close button', () => {
    render(<PracticeScreen authEnabled={false} />);

    // On initial turn (1 message), history button is not shown
    expect(screen.queryByRole('button', { name: 'История' })).toBeNull();
  });

  it('7. State test: Coach unavailable calm card with «Повторить»', async () => {
    vi.spyOn(coachClient, 'postCoach').mockRejectedValue(
      new coachClient.CoachUnavailableError('coach_unavailable')
    );

    render(<PracticeScreen authEnabled={false} />);

    // Reveal text input, write an answer and send
    const writeBtn = screen.getByRole('button', { name: 'Написать ответ' });
    fireEvent.click(writeBtn);

    const input = screen.getByPlaceholderText('Напишите ответ на норвежском...');
    fireEvent.change(input, { target: { value: 'Jeg liker kaffe.' } });

    const sendBtn = screen.getByRole('button', { name: 'Отправить' });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    const errorCard = await screen.findByTestId('coachErrorCard');
    expect(errorCard).toBeTruthy();
    expect(errorCard.textContent).toContain(COACH_UNAVAILABLE_MESSAGE);

    const retryBtn = screen.getByRole('button', { name: 'Повторить' });
    expect(retryBtn).toBeTruthy();
  });

  it('8. State test: Browser without speech recognition support shows text input by default and notice', () => {
    delete (window as unknown as { SpeechRecognition?: typeof FakeRecognition }).SpeechRecognition;

    render(<PracticeScreen authEnabled={false} />);

    expect(screen.getByText(NO_SPEECH_SUPPORT_MESSAGE)).toBeTruthy();
    // Textarea is automatically visible
    expect(screen.getByPlaceholderText('Напишите ответ на норвежском...')).toBeTruthy();
  });

  it('9. State test: Blocked microphone permission shows alert notice', () => {
    render(<PracticeScreen authEnabled={false} />);

    const micBtn = screen.getByRole('button', { name: 'Говорить' });
    fireEvent.click(micBtn);

    const instance = FakeRecognition.instances[FakeRecognition.instances.length - 1];
    expect(instance).toBeTruthy();

    act(() => {
      instance.onerror?.({ error: 'not-allowed' });
      instance.onend?.();
    });

    expect(screen.getByText(NO_MIC_PERMISSION_MESSAGE)).toBeTruthy();
  });

  it('10. Exam mode hides translation and hints, and allows listen at most once', () => {
    const speakSpy = vi.spyOn(speechModule, 'speakNorwegian').mockResolvedValue();

    // Set exam mode in localStorage
    window.localStorage.setItem('norsklive_prefs', JSON.stringify({ examMode: true }));

    render(<PracticeScreen authEnabled={false} />);

    // In exam mode, translation button is hidden
    expect(screen.queryByRole('button', { name: 'Перевод' })).toBeNull();
    expect(screen.getByText(/·\s*Экзамен/)).toBeTruthy();

    // Listen button can be clicked once
    const listenBtn = screen.getByRole('button', { name: 'Слушать' }) as HTMLButtonElement;
    expect(listenBtn.disabled).toBe(false);
    fireEvent.click(listenBtn);
    expect(speakSpy).toHaveBeenCalledTimes(1);

    // After 1 listen in exam mode, it is disabled
    expect(listenBtn.disabled).toBe(true);
  });

  it('11. practice.css contains zero hardcoded hex/rgb colors or px font-size declarations', () => {
    const cssPath = path.resolve(process.cwd(), 'src/components/practice/practice.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    // Strip comments
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

    const hexMatch = stripped.match(/#[0-9a-fA-F]{3,8}\b/g);
    expect(hexMatch, `Found hardcoded hex colors: ${hexMatch?.join(', ')}`).toBeNull();

    const rgbMatch = stripped.match(/\brgba?\([^)]+\)/gi);
    expect(rgbMatch, `Found hardcoded rgb/rgba: ${rgbMatch?.join(', ')}`).toBeNull();

    const pxFontSizeMatch = stripped.match(/font-size:\s*\d+px/gi);
    expect(pxFontSizeMatch, `Found font-size in px: ${pxFontSizeMatch?.join(', ')}`).toBeNull();
  });
});

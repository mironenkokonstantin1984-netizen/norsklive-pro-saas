// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, waitFor, screen } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';
import { TopicSheet } from '../src/components/practice/TopicSheet';
import { PREFS_STORAGE_KEY } from '../src/lib/prefs';
import { uiLangFromL1 } from '../src/lib/documentLang';
import { DocumentLang } from '../src/components/app/DocumentLang';
import { writePathPrefs } from '../src/lib/path/storage';
import { MIC_MESSAGES } from '../src/lib/useSpeechRecognition';

const REPLY = {
  reply_norsk: 'Så fint! Hvor lenge har du bodd der?',
  reply_l1: 'Как здорово! Как долго ты там живёшь?',
  correction: {
    original: 'Jeg bor i Bergen.',
    natural_bokmal: 'Jeg bor i Bergen.',
    b2_upgrade: 'Jeg har bodd i Bergen i tre år.',
    grammar_rule_l1: 'Всё верно.',
    cefr_estimate: 'A2',
    v2_status: 'Korrekt V2'
  },
  next_hints: [{ label: 'Svar', norsk: 'Jeg har bodd her i to år.', ru: 'Я живу здесь два года.' }]
};

function setExamMode(on: boolean) {
  window.localStorage.setItem(
    PREFS_STORAGE_KEY,
    JSON.stringify({ textSize: 'sm', tempo: 1, subtitles: true, contrast: false, examMode: on })
  );
}

async function answerOnce(container: HTMLElement) {
  fireEvent.change(container.querySelector('#userSpeechInput') as HTMLInputElement, {
    target: { value: 'Jeg bor i Bergen.' }
  });
  fireEvent.click(container.querySelector('#sendSpeechBtn') as HTMLButtonElement);
  await waitFor(() => expect(container.querySelector('#latestCorrectionCard')).toBeTruthy());
}

describe('#48 exam mode hides hints (B9)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => REPLY
    }) as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  test('learning mode (default) shows «Попробуйте» and the answer suggestions', async () => {
    const { container, getByText } = render(<StudioPage />);
    await answerOnce(container);
    expect(getByText('Попробуйте:')).toBeTruthy();
  });

  test('exam mode hides «Попробуйте» and the answer suggestions', async () => {
    setExamMode(true);
    const { container, queryByText } = render(<StudioPage />);
    await answerOnce(container);
    expect(queryByText('Попробуйте:')).toBeNull();
    expect(container.querySelector('[data-testid="correctionTry"]')).toBeNull();
    // The correction itself is still shown.
    expect(container.querySelector('#latestCorrectionCard')?.textContent).toContain('Всё верно.');
  });

  test('the topic sheet has an exam mode control, with study mode on by default', () => {
    const onChangeMode = vi.fn();
    render(
      <TopicSheet
        open={true}
        onClose={() => {}}
        onSelectTopic={() => {}}
        isExamMode={false}
        onChangeMode={onChangeMode}
      />
    );
    const studyRadio = screen.getByRole('radio', { name: 'Учёба' });
    const examRadio = screen.getByRole('radio', { name: 'Экзамен' });
    expect(studyRadio.getAttribute('aria-checked')).toBe('true');
    expect(examRadio.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(examRadio);
    expect(onChangeMode).toHaveBeenCalledWith(true);
  });
});

describe('#48 tab names (B4)', () => {
  afterEach(() => cleanup());

  test('module tabs were removed in favor of exam topics and modes', () => {
    const { container } = render(<StudioPage />);
    expect(container.querySelector('#moduleTabs')).toBeNull();
    expect(container.textContent).not.toMatch(/[123]\. (Norskprøve|Jobbintervju|CEFR)/);
  });
});

describe('#48 accessibility basics (B10)', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  test('<html lang> follows the L1 setting, ru by default', () => {
    expect(uiLangFromL1(undefined)).toBe('ru');
    expect(uiLangFromL1('ua')).toBe('uk');
    expect(uiLangFromL1('uk')).toBe('uk');
    expect(uiLangFromL1('en')).toBe('en');

    render(<DocumentLang />);
    expect(document.documentElement.lang).toBe('ru');

    writePathPrefs({ l1: 'uk' });
    expect(document.documentElement.lang).toBe('uk');
    writePathPrefs({ l1: 'en' });
    expect(document.documentElement.lang).toBe('en');
  });

  test('the studio has exactly one h1 and marks Norwegian text with lang="nb"', () => {
    const { container } = render(<StudioPage />);
    const headings = container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe('Практика');
    expect(container.querySelector('#chatStream .msg-norsk')?.getAttribute('lang')).toBe('nb');
  });

  test('the mic status is a polite status; a mic error becomes an alert', () => {
    const { container } = render(<StudioPage />);
    const status = container.querySelector('#micStatusText') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    // No speech recognition in jsdom: pressing the mic shows the «unsupported» message.
    fireEvent.click(container.querySelector('#micToggleBtn') as HTMLButtonElement);
    expect(status.textContent).toBe(MIC_MESSAGES.unsupported);
    expect(status.getAttribute('role')).toBe('alert');
  });
});

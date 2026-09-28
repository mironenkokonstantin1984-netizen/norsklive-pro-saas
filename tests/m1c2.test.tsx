// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CorrectionCard } from '../src/components/studio/CorrectionCard';
import { ScoreBar, parseCefrLevel } from '../src/components/studio/ScoreBar';
import { ChatPanel } from '../src/components/studio/ChatPanel';
import { StudioPage } from '../src/components/studio/StudioPage';
import { PREFS_STORAGE_KEY } from '../src/lib/prefs';
import { speakNorwegian } from '../src/lib/speech';
import type { Correction } from '../src/server/schemas';

const sampleCorrection: Correction = {
  original: 'Jeg tror hjemmekontor er bra fordi jeg sparer tid.',
  natural_bokmal: 'Jeg mener hjemmekontor er gunstig fordi jeg sparer reisetid.',
  b2_upgrade: 'Etter min mening bidrar hjemmekontor til bedre tidsbruk.',
  grammar_rule_l1: 'Глагол mene лучше подходит для аргументации на уровне B1/B2.',
  cefr_estimate: 'B1+',
  v2_status: '✓ Korrekt V2',
  samhandling_status: 'Хороший аргумент'
};

const olderCorrection: Correction = {
  original: 'Det er viktig.',
  natural_bokmal: 'Det er svært viktig.',
  b2_upgrade: 'Dette spiller en avgjørende rolle.',
  grammar_rule_l1: 'Добавьте наречие степени для уровня B1.',
  cefr_estimate: 'A2',
  v2_status: '✓ Korrekt V2'
};

describe('M1c-2 components & flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-text-size');
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('CorrectionCard', () => {
    it('renders word diff (<del> and <ins>), rule, L1 explanation, b2_upgrade with speak button, and expandable older corrections', () => {
      const onSpeak = vi.fn();
      const { container } = render(
        <CorrectionCard
          correction={sampleCorrection}
          olderCorrections={[olderCorrection]}
          l1Explanation="Дополнительное пояснение на родном языке"
          onSpeak={onSpeak}
        />
      );

      expect(screen.getByText('B1+')).toBeTruthy();

      const delEl = container.querySelector('del.correction-del');
      const insEls = container.querySelectorAll('ins.correction-ins');
      expect(delEl?.textContent).toBe('tror');
      expect(insEls.length).toBeGreaterThan(0);
      expect(Array.from(insEls).map((el) => el.textContent)).toContain('mener');

      expect(screen.getByText(sampleCorrection.grammar_rule_l1)).toBeTruthy();
      expect(screen.getByText('Дополнительное пояснение на родном языке')).toBeTruthy();
      expect(screen.getByText(/Попробуйте:/)).toBeTruthy();
      expect(screen.getByText(sampleCorrection.b2_upgrade)).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: /Прослушать/i }));
      expect(onSpeak).toHaveBeenCalledWith(sampleCorrection.b2_upgrade);

      const historyToggle = screen.getByRole('button', {
        name: /Предыдущие замечания \(1\)/i
      });
      expect(historyToggle.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByText(olderCorrection.grammar_rule_l1)).toBeNull();

      fireEvent.click(historyToggle);
      expect(historyToggle.getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByText(olderCorrection.grammar_rule_l1)).toBeTruthy();
      expect(container.querySelector('.correction-older-list')?.textContent).toContain('svært');
    });

    it('renders cleanly when original and natural_bokmal are identical (no <del> or <ins>)', () => {
      const identicalCorrection: Correction = {
        ...sampleCorrection,
        original: 'Jeg sparer tid.',
        natural_bokmal: 'Jeg sparer tid.'
      };
      const { container } = render(
        <CorrectionCard
          correction={identicalCorrection}
          olderCorrections={[]}
          onSpeak={vi.fn()}
        />
      );

      expect(container.querySelector('del')).toBeNull();
      expect(container.querySelector('ins')).toBeNull();
      expect(container.querySelector('.correction-utterance')?.textContent).toContain(
        'Jeg sparer tid.'
      );
    });
  });

  describe('ScoreBar & parseCefrLevel', () => {
    it('maps CEFR strings to the lowest named level or null', () => {
      expect(parseCefrLevel('B1+')).toBe('B1');
      expect(parseCefrLevel('B1+ / B2')).toBe('B1');
      expect(parseCefrLevel('A2 / B1')).toBe('A2');
      expect(parseCefrLevel('B2')).toBe('B2');
      expect(parseCefrLevel('C1')).toBeNull();
      expect(parseCefrLevel(undefined)).toBeNull();
    });

    it('renders role="meter" with A2, B1, B2, and null states without %', () => {
      const { rerender, container } = render(<ScoreBar label="Общая оценка" level={null} />);
      const meter = screen.getByRole('meter');
      expect(meter.getAttribute('aria-valuemin')).toBe('0');
      expect(meter.getAttribute('aria-valuemax')).toBe('3');
      expect(meter.getAttribute('aria-valuenow')).toBe('0');
      expect(meter.getAttribute('aria-valuetext')).toContain('Нет данных');
      expect(container.textContent).not.toContain('%');

      rerender(<ScoreBar label="Общая оценка" level="A2" />);
      expect(meter.getAttribute('aria-valuenow')).toBe('1');
      const levelTextA2 = container.querySelector('.scorebar-level');
      expect(levelTextA2?.classList.contains('scorebar-level-muted')).toBe(true);

      rerender(<ScoreBar label="Общая оценка" level="B1" />);
      expect(meter.getAttribute('aria-valuenow')).toBe('2');

      rerender(<ScoreBar label="Общая оценка" level="B2" />);
      expect(meter.getAttribute('aria-valuenow')).toBe('3');
      expect(container.textContent).not.toContain('%');
    });
  });

  describe('PracticeSettingsSheet («Удобство»), 3 text-size steps & localStorage resilience', () => {
    it('sets all three data-text-size values (sm/md/lg) with scale steps 1 / 1.12 / 1.25 (nothing below 13px), updates tempo & switches, persists to norsklive_prefs, and restores focus on Escape', () => {
      const tokensCss = fs.readFileSync(
        path.resolve(__dirname, '../src/styles/tokens.css'),
        'utf-8'
      );
      expect(tokensCss).toContain('--text-scale: 1;');
      expect(tokensCss).toContain('--text-scale: 1.12;');
      expect(tokensCss).toContain('--text-scale: 1.25;');
      expect(tokensCss).toContain('max(0.8125rem, calc(0.8125rem * var(--text-scale, 1)))');

      render(<StudioPage />);

      // Default on mount is sm (scale 1)
      expect(document.documentElement.getAttribute('data-text-size')).toBe('sm');
      expect(document.documentElement.classList.contains('text-size-sm')).toBe(true);

      const comfortBtn = document.getElementById('comfortSettingsBtn') as HTMLButtonElement;
      expect(comfortBtn).toBeTruthy();

      comfortBtn.focus();
      fireEvent.click(comfortBtn);

      const dialog = screen.getByRole('dialog', { name: 'Удобство' });
      expect(dialog).toBeTruthy();

      // Step 2: md (Крупный -> 1.12)
      fireEvent.click(screen.getByRole('button', { name: 'Крупный' }));
      expect(document.documentElement.getAttribute('data-text-size')).toBe('md');
      expect(document.documentElement.classList.contains('text-size-md')).toBe(true);

      // Step 3: lg (Очень крупный -> 1.25)
      fireEvent.click(screen.getByRole('button', { name: 'Очень крупный' }));
      expect(document.documentElement.getAttribute('data-text-size')).toBe('lg');
      expect(document.documentElement.classList.contains('text-size-lg')).toBe(true);

      // Step 1: sm (Стандартный -> 1)
      fireEvent.click(screen.getByRole('button', { name: 'Стандартный' }));
      expect(document.documentElement.getAttribute('data-text-size')).toBe('sm');
      expect(document.documentElement.classList.contains('text-size-sm')).toBe(true);

      // Switch back to lg to verify persistence
      fireEvent.click(screen.getByRole('button', { name: 'Очень крупный' }));

      // Tempo -> 0.8
      const slowTempoBtn = screen.getByRole('button', { name: '0.8' });
      fireEvent.click(slowTempoBtn);

      // Contrast switch -> on
      const contrastSwitch = document.getElementById('contrastSwitch') as HTMLButtonElement;
      expect(contrastSwitch.getAttribute('role')).toBe('switch');
      expect(contrastSwitch.getAttribute('aria-checked')).toBe('false');
      fireEvent.click(contrastSwitch);
      expect(contrastSwitch.getAttribute('aria-checked')).toBe('true');
      expect(document.documentElement.getAttribute('data-theme')).toBe('contrast');

      const stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
      expect(stored.textSize).toBe('lg');
      expect(stored.tempo).toBe(0.8);
      expect(stored.contrast).toBe(true);

      // Escape closes dialog and restores focus to #comfortSettingsBtn
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Удобство' })).toBeNull();
      expect(document.activeElement).toBe(comfortBtn);
    });

    it('does not crash when localStorage throws SecurityError / QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage disabled');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      expect(() => render(<StudioPage />)).not.toThrow();
      const comfortBtn = document.getElementById('comfortSettingsBtn') as HTMLButtonElement;
      fireEvent.click(comfortBtn);
      const lgBtn = screen.getByRole('button', { name: 'Очень крупный' });
      expect(() => fireEvent.click(lgBtn)).not.toThrow();
    });
  });

  describe('Examiner subtitles & «Как ощущения?» on 5th turn', () => {
    it('highlights active spoken word when onboundary fires and clears on end', () => {
      const chatHistory = [
        { sender: 'ai' as const, norsk: 'Hei, hvordan går det med deg?' },
        { sender: 'user' as const, norsk: 'Svar 1' }
      ];

      const { container, rerender } = render(
        <ChatPanel
          chatHistory={chatHistory}
          coachingHistory={[sampleCorrection]}
          partnerName="Sensor"
          l1Lang="ru"
          blurMode={false}
          subtitlesEnabled={true}
          activeSpeech={{ text: 'Hei, hvordan går det med deg?', charIndex: 5 }}
          onSpeak={vi.fn()}
          onSaveToGlossary={vi.fn()}
        />
      );

      const mark = container.querySelector('mark.subtitle-word-active');
      expect(mark?.textContent).toBe('hvordan');

      rerender(
        <ChatPanel
          chatHistory={chatHistory}
          coachingHistory={[sampleCorrection]}
          partnerName="Sensor"
          l1Lang="ru"
          blurMode={false}
          subtitlesEnabled={true}
          activeSpeech={null}
          onSpeak={vi.fn()}
          onSaveToGlossary={vi.fn()}
        />
      );
      expect(container.querySelector('mark.subtitle-word-active')).toBeNull();
    });

    it('works without boundary events: (a) no window.speechSynthesis and (b) mocked speechSynthesis that fires onend without onboundary, rendering without <mark>', () => {
      const originalSpeechSynthesis = window.speechSynthesis;
      const originalUtterance = window.SpeechSynthesisUtterance;

      try {
        // (a) No window.speechSynthesis
        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          writable: true,
          value: undefined
        });
        const onBoundaryA = vi.fn();
        const onEndA = vi.fn();
        expect(() =>
          speakNorwegian('Hei, hvordan går det?', {
            onBoundary: onBoundaryA,
            onEnd: onEndA
          })
        ).not.toThrow();
        expect(onBoundaryA).not.toHaveBeenCalled();

        // (b) Mocked speechSynthesis whose utterance never fires onboundary, only onend
        class MockUtterance {
          text: string;
          lang = 'nb-NO';
          rate = 1;
          onstart: (() => void) | null = null;
          onend: (() => void) | null = null;
          onerror: (() => void) | null = null;
          onboundary: ((ev: { charIndex?: number }) => void) | null = null;
          constructor(text: string) {
            this.text = text;
          }
        }
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
          configurable: true,
          writable: true,
          value: MockUtterance
        });
        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          writable: true,
          value: {
            cancel: vi.fn(),
            getVoices: () => [],
            speak: (utter: MockUtterance) => {
              utter.onstart?.();
              // Never fires utter.onboundary!
              utter.onend?.();
            }
          }
        });

        const onBoundaryB = vi.fn();
        const onEndB = vi.fn();
        expect(() =>
          speakNorwegian('Hei, hvordan går det?', {
            onBoundary: onBoundaryB,
            onEnd: onEndB
          })
        ).not.toThrow();
        expect(onBoundaryB).not.toHaveBeenCalled();
        expect(onEndB).toHaveBeenCalledTimes(1);

        const { container } = render(<StudioPage />);
        const speakBtns = container.querySelectorAll('.btn-speak');
        expect(speakBtns.length).toBeGreaterThan(0);
        expect(() => fireEvent.click(speakBtns[0])).not.toThrow();
        expect(container.querySelector('mark')).toBeNull();
      } finally {
        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          writable: true,
          value: originalSpeechSynthesis
        });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
          configurable: true,
          writable: true,
          value: originalUtterance
        });
      }
    });

    it('«Как ощущения?»: clicking «Тревожно» writes mood: "Тревожно" + timestamp to norsklive_prefs, and dismiss hides the card without writing mood', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            reply_norsk: 'Neste spørsmål.',
            reply_l1: 'Следующий вопрос.',
            correction: sampleCorrection,
            next_hints: []
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      // 1. Test dismiss button hides the card and writes no mood
      const { container, unmount } = render(<StudioPage />);
      const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
      const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

      for (let i = 1; i <= 5; i++) {
        fireEvent.change(input, { target: { value: `Svar ${i}` } });
        fireEvent.click(sendBtn);
      }

      await waitFor(() => {
        expect(container.querySelector('#moodCheckCard')).toBeTruthy();
      });

      const dismissBtn = screen.getByRole('button', { name: 'Закрыть вопрос' });
      fireEvent.click(dismissBtn);

      expect(container.querySelector('#moodCheckCard')).toBeNull();
      const afterDismiss = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
      expect(afterDismiss.mood).toBeUndefined();

      unmount();
      window.localStorage.clear();

      // 2. Test clicking «Тревожно» writes mood: 'Тревожно' + timestamp to norsklive_prefs
      const { container: container2 } = render(<StudioPage />);
      const input2 = container2.querySelector('#userSpeechInput') as HTMLInputElement;
      const sendBtn2 = container2.querySelector('#sendSpeechBtn') as HTMLButtonElement;

      for (let i = 1; i <= 5; i++) {
        fireEvent.change(input2, { target: { value: `Svar ${i}` } });
        fireEvent.click(sendBtn2);
      }

      await waitFor(() => {
        expect(container2.querySelector('#moodCheckCard')).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Тревожно' }));
      expect(container2.querySelector('#moodCheckCard')).toBeNull();

      const storedPrefs = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
      expect(storedPrefs.mood).toBe('Тревожно');
      expect(typeof storedPrefs.timestamp).toBe('string');
      expect(storedPrefs.timestamp.length).toBeGreaterThan(10);
    });

    it('renders CorrectionCard in StudioPage chat right after a learner turn', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            reply_norsk: 'Interessant synspunkt! Kan du utdype?',
            reply_l1: 'Интересная точка зрения! Можешь развить мысль?',
            correction: sampleCorrection,
            next_hints: []
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const { container } = render(<StudioPage />);
      const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
      const sendBtn = container.querySelector('#sendSpeechBtn') as HTMLButtonElement;

      fireEvent.change(input, {
        target: { value: 'Jeg tror hjemmekontor er bra fordi jeg sparer tid.' }
      });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(container.querySelector('#latestCorrectionCard')).toBeTruthy();
      });

      const delEl = container.querySelector('#latestCorrectionCard del.correction-del');
      expect(delEl?.textContent).toBe('tror');
    });
  });
});

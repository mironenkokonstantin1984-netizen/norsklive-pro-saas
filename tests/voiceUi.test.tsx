// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VoiceNotice } from '../src/components/studio/VoiceNotice';
import { PracticeSettingsSheet } from '../src/components/studio/PracticeSettingsSheet';
import { DEFAULT_PRACTICE_PREFS } from '../src/lib/prefs';
import { resetVoiceState, VOICE_STORAGE_KEY } from '../src/lib/speech';

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

describe('#51 voice interface', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetVoiceState();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    resetVoiceState();
  });

  test('the notice appears when the device has no Norwegian voice, with help and dismiss', async () => {
    vi.useFakeTimers();
    installVoices([{ name: 'Sven', lang: 'sv-SE' }]);
    render(<VoiceNotice />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText(/нет норвежского голоса/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Как включить' }));
    expect(screen.getByText(/Android:/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }));
    expect(screen.queryByText(/нет норвежского голоса/)).toBeNull();
    expect(window.sessionStorage.getItem('norsklive_voice_notice_dismissed')).toBe('1');
  });

  test('no notice when a Norwegian voice exists', async () => {
    installVoices([{ name: 'Nora', lang: 'nb-NO' }]);
    render(<VoiceNotice />);
    await act(async () => {});
    expect(screen.queryByText(/нет норвежского голоса/)).toBeNull();
  });

  test('the settings sheet shows the voice, lets the learner choose and test it', async () => {
    installVoices([
      { name: 'Nora', lang: 'nb-NO', localService: true },
      { name: 'Pernille Online', lang: 'nb-NO', localService: false }
    ]);
    render(
      <PracticeSettingsSheet
        open
        prefs={DEFAULT_PRACTICE_PREFS}
        onChangePrefs={vi.fn()}
        onClose={vi.fn()}
      />
    );
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Проверить голос' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Nora' }));
    expect(window.localStorage.getItem(VOICE_STORAGE_KEY)).toBe('Nora');
    expect(screen.getByRole('radio', { name: 'Nora' }).getAttribute('aria-checked')).toBe('true');
  });
});

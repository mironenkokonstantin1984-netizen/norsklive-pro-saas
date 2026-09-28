// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PathHome } from '../src/components/path/PathHome';
import { StudioPage } from '../src/components/studio/StudioPage';
import { readPathPrefs, writePathPrefs } from '../src/lib/path/storage';

describe('PathHome & FirstRun (Issue #28 & Issue #36)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows FirstRun when not onboarded, and clicking «Пропустить» sets onboarded=true and shows the home screen', () => {
    render(<PathHome />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('1 из 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Когда у вас экзамен?' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(readPathPrefs().onboarded).toBe(true);

    expect(screen.getByRole('heading', { name: 'Мой путь к B1' })).toBeTruthy();
    expect(
      screen.getByText('Пройдите первую практику, и мы оценим уровень')
    ).toBeTruthy();

    const startLink = screen.getByRole('link', { name: 'Начать практику' });
    expect(startLink.getAttribute('href')).toBe('/studio');
    expect(screen.getByText('Сохранено слов: 0')).toBeTruthy();
  });

  it('navigates all 3 FirstRun steps, sets onboarded=true and examDate, goes to /studio on final button, and StudioPage reads profile', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00+02:00'));

    render(<PathHome />);

    // Step 1: pick exam date -> automatically advances to Step 2
    const step1DateInput = within(screen.getByRole('dialog')).getByLabelText('Дата экзамена');
    fireEvent.change(step1DateInput, { target: { value: '2026-10-18' } });

    expect(screen.getByText('2 из 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Какой уровень нужен?' })).toBeTruthy();

    // Step 2: click «Не уверен» (maps to B1) -> advances to Step 3
    fireEvent.click(screen.getByRole('button', { name: 'Не уверен' }));

    expect(screen.getByText('3 из 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'На каком языке объяснять?' })).toBeTruthy();

    // Step 3: choose Українська (uk) and click «Начать первую практику»
    fireEvent.click(screen.getByRole('button', { name: 'Українська' }));
    fireEvent.click(screen.getByRole('button', { name: 'Начать первую практику' }));

    const saved = readPathPrefs();
    expect(saved.onboarded).toBe(true);
    expect(saved.targetLevel).toBe('B1');
    expect(saved.l1).toBe('uk');
    expect(saved.examDate).toBe('2026-10-18');

    // Home screen reflects the saved exam date from FirstRun
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('До экзамена 20 дней')).toBeTruthy();

    // StudioPage initializes l1Lang from norsklive_path ('uk' -> 'ua')
    cleanup();
    render(<StudioPage />);
    const l1Select = document.getElementById('l1LangSelect') as HTMLSelectElement | null;
    expect(l1Select?.value).toBe('ua');
  });

  it('pressing Escape inside FirstRun skips onboarding and sets onboarded=true', () => {
    render(<PathHome />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(readPathPrefs().onboarded).toBe(true);
  });

  it('reads saved-words count from mocked norsklive_glossary when onboarded', () => {
    writePathPrefs({ onboarded: true });
    window.localStorage.setItem(
      'norsklive_glossary',
      JSON.stringify([
        { word: 'samfunn', translation: 'общество' },
        { word: 'trygghet', translation: 'безопасность' },
        { word: 'mulighet', translation: 'возможность' },
        { word: 'hverdag', translation: 'будни' }
      ])
    );

    render(<PathHome />);

    expect(screen.getByText('Сохранено слов: 4')).toBeTruthy();
  });

  it('setting an exam date on home screen shows the right day count and clearing it hides the countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00+02:00'));
    writePathPrefs({ onboarded: true });

    render(<PathHome />);

    const dateInput = screen.getByLabelText('Дата экзамена');
    fireEvent.change(dateInput, { target: { value: '2026-10-18' } });

    expect(screen.getByText('До экзамена 20 дней')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeTruthy();

    fireEvent.change(dateInput, { target: { value: '' } });

    expect(screen.queryByText(/До экзамена/)).toBeNull();
  });

  it('does not crash when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => render(<PathHome />)).not.toThrow();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    expect(screen.getByRole('heading', { name: 'Мой путь к B1' })).toBeTruthy();
  });
});

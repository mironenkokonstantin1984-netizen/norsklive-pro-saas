// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PathHome } from '../src/components/path/PathHome';

describe('PathHome', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders empty state with title, level card, /studio link, and 0 saved words', () => {
    render(<PathHome />);

    expect(screen.getByRole('heading', { name: 'Мой путь к B1' })).toBeTruthy();
    expect(
      screen.getByText('Пройдите первую практику, и мы оценим уровень')
    ).toBeTruthy();

    const startLink = screen.getByRole('link', { name: 'Начать практику' });
    expect(startLink.getAttribute('href')).toBe('/studio');

    expect(screen.getByText('Сохранено слов: 0')).toBeTruthy();
  });

  it('reads saved-words count from mocked norsklive_glossary', () => {
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

  it('setting an exam date shows the right day count and clearing it hides the countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00+02:00'));

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
    expect(screen.getByRole('heading', { name: 'Мой путь к B1' })).toBeTruthy();
  });
});

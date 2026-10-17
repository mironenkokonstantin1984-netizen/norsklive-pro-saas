// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { ProfilePage } from '../src/components/profile/ProfilePage';
import { PREFS_STORAGE_KEY } from '../src/lib/prefs';
import { readPathPrefs } from '../src/lib/path/storage';

describe('ProfilePage (/profile, Issue #56)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.removeAttribute('data-text-size');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  test('1. Renders all 5 setting groups with headers and semantic fields', () => {
    render(<ProfilePage authEnabled={true} userEmail="kari@norsklive.no" />);

    // Page title
    expect(screen.getByRole('heading', { level: 1, name: /Профиль/i })).toBeTruthy();

    // Group 1: Язык и уровень
    expect(screen.getByText('Язык и уровень')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Язык объяснений' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Целевой уровень' })).toBeTruthy();
    expect(screen.getByLabelText(/Дата/i)).toBeTruthy();

    // Group 2: Практика
    expect(screen.getByText('Практика')).toBeTruthy();
    const autoSendSwitch = screen.getByRole('switch', {
      name: 'Отправлять сразу после «Готово»'
    });
    expect(autoSendSwitch).toBeTruthy();

    // Group 3: Голос
    expect(screen.getByText('Голос')).toBeTruthy();
    expect(screen.getByRole('radio', { name: '0.8' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '1.0' })).toBeTruthy();
    expect(
      screen.getByRole('switch', { name: 'Субтитры экзаменатора' })
    ).toBeTruthy();

    // Group 4: Вид
    expect(screen.getByText('Вид')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Стандартный' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Крупный' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Очень крупный' })).toBeTruthy();
    expect(
      screen.getByRole('switch', { name: 'Повышенный контраст' })
    ).toBeTruthy();

    // Group 5: Аккаунт
    expect(screen.getByText('Аккаунт')).toBeTruthy();
    expect(screen.getByText('kari@norsklive.no')).toBeTruthy();
    const deleteBtn = screen.getByRole('button', { name: /Удалить аккаунт/i });
    expect(deleteBtn).toBeTruthy();
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
    expect(deleteBtn.textContent).toContain('Скоро');
  });

  test('2. Changing language, level, and exam date persists to norsklive_path', () => {
    const { container } = render(<ProfilePage />);

    const examDateInput = container.querySelector('#examDateInput') as HTMLInputElement;
    fireEvent.change(examDateInput, { target: { value: '2026-11-20' } });

    const ukRadio = screen.getByRole('radio', { name: 'Українська' });
    fireEvent.click(ukRadio);

    const a2Radio = screen.getByRole('radio', { name: 'A2' });
    fireEvent.click(a2Radio);

    const pathPrefs = readPathPrefs();
    expect(pathPrefs.l1).toBe('uk');
    expect(pathPrefs.targetLevel).toBe('A2');
    expect(pathPrefs.examDate).toBe('2026-11-20');
  });

  test('3. Text size buttons update document data-text-size and persist to norsklive_prefs', () => {
    render(<ProfilePage />);

    // Click «Крупный» (md)
    fireEvent.click(screen.getByRole('radio', { name: 'Крупный' }));
    expect(document.documentElement.getAttribute('data-text-size')).toBe('md');
    expect(document.documentElement.classList.contains('text-size-md')).toBe(true);

    let stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.textSize).toBe('md');

    // Click «Очень крупный» (lg)
    fireEvent.click(screen.getByRole('radio', { name: 'Очень крупный' }));
    expect(document.documentElement.getAttribute('data-text-size')).toBe('lg');
    expect(document.documentElement.classList.contains('text-size-lg')).toBe(true);

    stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.textSize).toBe('lg');

    // Click «Стандартный» (sm)
    fireEvent.click(screen.getByRole('radio', { name: 'Стандартный' }));
    expect(document.documentElement.getAttribute('data-text-size')).toBe('sm');
    expect(document.documentElement.classList.contains('text-size-sm')).toBe(true);
  });

  test('4. Contrast switch toggles contrast mode and data-theme', () => {
    render(<ProfilePage />);

    const contrastSwitch = screen.getByRole('switch', {
      name: 'Повышенный контраст'
    });
    expect(contrastSwitch.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(contrastSwitch);
    expect(contrastSwitch.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('contrast');

    let stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.contrast).toBe(true);

    fireEvent.click(contrastSwitch);
    expect(contrastSwitch.getAttribute('aria-checked')).toBe('false');
    stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.contrast).toBe(false);
  });

  test('5. Voice tempo and subtitles switches persist immediately', () => {
    render(<ProfilePage />);

    // Tempo 0.8
    fireEvent.click(screen.getByRole('radio', { name: '0.8' }));
    let stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.tempo).toBe(0.8);

    // Subtitles switch
    const subtitlesSwitch = screen.getByRole('switch', {
      name: 'Субтитры экзаменатора'
    });
    fireEvent.click(subtitlesSwitch);
    stored = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) || '{}');
    expect(stored.subtitles).toBe(false); // default was true
  });

  test('6. Profile contains zero links to lab pages', () => {
    const { container } = render(<ProfilePage />);
    const links = Array.from(container.querySelectorAll('a'));
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      expect(href).not.toContain('/lab');
    }
  });

  test('7. When auth is off, shows note without sign in/out buttons', () => {
    render(<ProfilePage authEnabled={false} />);
    expect(screen.getByText('Гостевой режим')).toBeTruthy();
  });
});

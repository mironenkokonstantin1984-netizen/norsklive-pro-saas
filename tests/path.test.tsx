// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PathHome } from '../src/components/path/PathHome';
import {
  clearPathEvents,
  readPathEvents,
  readPathPrefs,
  writePathPrefs
} from '../src/lib/path/storage';

describe('PathHome & FirstRun Redesign (Issue #55)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearPathEvents();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows FirstRun when not onboarded, and clicking «Пропустить» sets onboarded=true and shows home with resume card', () => {
    render(<PathHome />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('1 из 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'На каком языке объяснять?' })).toBeTruthy();
    expect(
      screen.getByText('Привет, я Нора. Три коротких вопроса, и начнём.')
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    const prefs = readPathPrefs();
    expect(prefs.onboarded).toBe(true);
    expect(prefs.introDone).toBe(false);

    // Home screen
    expect(screen.getByRole('heading', { name: 'Сегодня: 10 минут практики' })).toBeTruthy();
    const startLink = screen.getByRole('link', { name: 'Начать практику' });
    expect(startLink.getAttribute('href')).toBe('/practice');

    // Resume card is visible because intro was skipped
    const resumeCard = screen.getByRole('region', { name: 'Пройти знакомство' });
    expect(resumeCard).toBeTruthy();

    // Clicking «Скрыть» dismisses resume card
    fireEvent.click(within(resumeCard).getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByRole('region', { name: 'Пройти знакомство' })).toBeNull();
    expect(readPathPrefs().introDismissed).toBe(true);
  });

  it('navigates all FirstRun steps, completes intro mini-practice and summary, and lands on home without resume card', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00+02:00'));

    render(<PathHome />);

    // Step 1: select 'Українська' and click 'Далі'
    fireEvent.click(screen.getByRole('button', { name: 'Українська' }));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    // Step 2: select 'B1', pick date '2026-10-18', click 'Далі'
    expect(screen.getByText('2 из 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ціль та дата іспиту' })).toBeTruthy();
    const dateInput = screen.getByLabelText(/Дата экзамена/);
    fireEvent.change(dateInput, { target: { value: '2026-10-18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    // Step 3: Question 1 («Hva heter du?»)
    expect(screen.getByText('3 из 3')).toBeTruthy();
    expect(screen.getByText('Вопрос 1 из 3')).toBeTruthy();
    expect(screen.getByText('«Hva heter du?»')).toBeTruthy();

    const answerInput1 = screen.getByRole('textbox', { name: 'Ваш ответ' });
    fireEvent.change(answerInput1, { target: { value: 'Jeg heter Anna' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ответить' }));

    expect(screen.getByText('Хорошо!')).toBeTruthy();
    expect(screen.getByText('Ви правильно назвали ім’я. Чудовий початок!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));

    // Step 3: Question 2 («Hvor kommer du fra?»)
    expect(screen.getByText('Вопрос 2 из 3')).toBeTruthy();
    expect(screen.getByText('«Hvor kommer du fra?»')).toBeTruthy();
    const answerInput2 = screen.getByRole('textbox', { name: 'Ваш ответ' });
    fireEvent.change(answerInput2, { target: { value: 'Jeg kommer fra Ukraina' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ответить' }));
    expect(screen.getByText('Правильний порядок слів і прийменник fra.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));

    // Step 3: Question 3 («Hva jobber du med?»)
    expect(screen.getByText('Вопрос 3 из 3')).toBeTruthy();
    expect(screen.getByText('«Hva jobber du med?»')).toBeTruthy();
    const answerInput3 = screen.getByRole('textbox', { name: 'Ваш ответ' });
    fireEvent.change(answerInput3, { target: { value: 'Jeg jobber som lærer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ответить' }));
    expect(screen.getByText('Прекрасно! Усі три відповіді отримано.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));

    // Step 4: Summary screen
    expect(screen.getByRole('heading', { name: 'Отличное начало!' })).toBeTruthy();
    expect(screen.getByText('Вы сказали три фразы')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Перейти на главную' }));

    // Dialog is closed
    expect(screen.queryByRole('dialog')).toBeNull();

    const saved = readPathPrefs();
    expect(saved.onboarded).toBe(true);
    expect(saved.introDone).toBe(true);
    expect(saved.targetLevel).toBe('B1');
    expect(saved.l1).toBe('uk');
    expect(saved.examDate).toBe('2026-10-18');

    // Home screen shows exam countdown and NO resume card
    expect(screen.getByText('До экзамена 20 дней')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Пройти знакомство' })).toBeNull();
  });

  it('pressing Escape inside FirstRun skips onboarding and sets onboarded=true', () => {
    render(<PathHome />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(readPathPrefs().onboarded).toBe(true);
  });

  it('home screen has at most three main blocks and exactly one filled button', () => {
    writePathPrefs({ onboarded: true, introDone: true });
    render(<PathHome />);

    // At most 3 blocks: Practice, Words, Path
    expect(screen.getByRole('region', { name: 'Практика' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Слова' })).toBeTruthy();
    expect(screen.getByRole('region', { name: /Мой путь/ })).toBeTruthy();

    // Exactly one filled button on the home screen
    const filledButtons = document.querySelectorAll('.path-primary-link, .btn-primary');
    expect(filledButtons.length).toBe(1);
    expect(filledButtons[0].textContent?.trim()).toBe('Начать практику');

    // Subscription card is absent
    expect(document.getElementById('plans')).toBeNull();
    expect(screen.queryByText(/Оплата появится скоро/)).toBeNull();
  });

  it('changes chosen topic using the topic selection sheet', () => {
    writePathPrefs({ onboarded: true, introDone: true, selectedTopic: 'arbeid' });
    render(<PathHome />);

    expect(screen.getByText('Тема: Работа')).toBeTruthy();

    // Click «Изменить» to open topic sheet
    fireEvent.click(screen.getByRole('button', { name: 'Изменить' }));

    const topicDialog = screen.getByRole('dialog', { name: 'Выбор темы' });
    expect(topicDialog).toBeTruthy();

    // Select «Врач»
    fireEvent.click(within(topicDialog).getByRole('button', { name: 'Врач' }));

    // Sheet closes and topic updates
    expect(screen.queryByRole('dialog', { name: 'Выбор темы' })).toBeNull();
    expect(screen.getByText('Тема: Врач')).toBeTruthy();
    expect(readPathPrefs().selectedTopic).toBe('helse');
  });

  it('edits exam date using the date sheet and updates countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00+02:00'));
    writePathPrefs({ onboarded: true, introDone: true });

    render(<PathHome />);

    // Unset state: shows button «Задать дату экзамена»
    expect(screen.queryByText(/До экзамена/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Задать дату экзамена' }));

    const dateDialog = screen.getByRole('dialog', { name: 'Дата экзамена' });
    expect(dateDialog).toBeTruthy();

    const sheetInput = within(dateDialog).getByLabelText(/Дата экзамена/);
    fireEvent.change(sheetInput, { target: { value: '2026-10-18' } });
    fireEvent.click(within(dateDialog).getByRole('button', { name: 'Сохранить' }));

    expect(screen.queryByRole('dialog', { name: 'Дата экзамена' })).toBeNull();
    expect(screen.getByText('До экзамена 20 дней')).toBeTruthy();

    // Clear date via sheet
    fireEvent.click(screen.getByRole('button', { name: 'Изменить дату' }));
    const reopenDialog = screen.getByRole('dialog', { name: 'Дата экзамена' });
    fireEvent.click(within(reopenDialog).getByRole('button', { name: 'Очистить' }));

    expect(screen.queryByRole('dialog', { name: 'Дата экзамена' })).toBeNull();
    expect(screen.queryByText(/До экзамена/)).toBeNull();
  });

  it('shows personalized greeting when signed in and neutral greeting when anonymous', () => {
    writePathPrefs({ onboarded: true, introDone: true });

    const { rerender } = render(<PathHome userEmail="anna.hansen@example.com" />);
    expect(screen.getByText('Здравствуйте, Anna')).toBeTruthy();

    rerender(<PathHome userEmail={null} />);
    expect(screen.getByText('Здравствуйте')).toBeTruthy();
  });

  it('renders limit card when limitReached is true without extra filled buttons', () => {
    writePathPrefs({ onboarded: true, introDone: true });
    render(<PathHome limitReached={true} />);

    expect(screen.getByTestId('dailyLimitCard')).toBeTruthy();
    expect(
      screen.getByText('На сегодня бесплатные ответы закончились')
    ).toBeTruthy();

    // Still only 1 filled button
    const filledButtons = document.querySelectorAll('.path-primary-link, .btn-primary');
    expect(filledButtons.length).toBe(1);
    expect(filledButtons[0].textContent?.trim()).toBe('Начать практику');
  });

  it('instruments norsklive_events with timestamps and event names without user text', () => {
    render(<PathHome />);

    // Step 1 shown
    let events = readPathEvents();
    expect(events.some((e) => e.name === 'firstrun_step_shown')).toBe(true);

    // Skip
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    events = readPathEvents();
    expect(events.some((e) => e.name === 'firstrun_skipped')).toBe(true);

    // Click «Начать практику»
    fireEvent.click(screen.getByRole('link', { name: 'Начать практику' }));
    events = readPathEvents();
    expect(events.some((e) => e.name === 'practice_started')).toBe(true);

    // Verify console helper
    const windowHelper = (window as unknown as { __readNorskLiveEvents?: () => unknown })
      .__readNorskLiveEvents;
    expect(typeof windowHelper).toBe('function');
    expect(windowHelper?.()).toEqual(events);

    // Ensure NO user text or email leaked into events
    for (const ev of events) {
      expect(typeof ev.name).toBe('string');
      expect(typeof ev.ts).toBe('number');
      expect((ev as unknown as Record<string, unknown>).userText).toBeUndefined();
      expect((ev as unknown as Record<string, unknown>).email).toBeUndefined();
    }
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
    expect(screen.getByRole('heading', { name: 'Сегодня: 10 минут практики' })).toBeTruthy();
  });
});

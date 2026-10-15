// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResultScreen } from '../src/components/practice/ResultScreen';
import {
  type PracticeResultData,
  savePracticeResult,
  readPracticeResult,
  clearPracticeResult
} from '../src/lib/practice/resultData';
import { readWordsProgress } from '../src/lib/words/progress';

describe('ResultScreen («Итог» screen, Issue #54)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const sampleResultWithData: PracticeResultData = {
    id: 'test-session-1',
    scenarioId: 'arbeid-1',
    scenarioTitle: 'Работа и профессия',
    module: 'norskprove',
    isExam: false,
    completedAt: '2026-10-14T18:00:00.000Z',
    learnerTurnCount: 4,
    hasEnoughData: true,
    criteria: {
      uttale: 'B1',
      ordforrad: 'B1',
      grammatikk: 'A2',
      samhandling: 'B1'
    },
    improvements: [
      {
        type: 'word_order',
        typeTitle: 'Порядок слов',
        ruleName: 'Правило V2',
        explanation: 'Глагол должен стоять на 2-м месте.',
        quote: 'I dag jeg jobber',
        fix: 'I dag jobber jeg'
      },
      {
        type: 'article',
        typeTitle: 'Артикли и род',
        ruleName: 'Средний род',
        explanation: 'Слово hus среднего рода (et hus).',
        quote: 'en hus',
        fix: 'et hus'
      }
    ],
    stumbledWords: [
      {
        id: 'sykehus',
        word: 'sykehus',
        translation: 'больница'
      },
      {
        id: 'erfaring',
        word: 'erfaring',
        translation: 'опыт'
      }
    ],
    turns: [
      { sender: 'ai', text: 'Hva jobber du med?' },
      { sender: 'user', text: 'I dag jeg jobber på en sykehus.' }
    ]
  };

  it('renders all 4 criteria as ScoreBar when enough data is present, with mandatory disclaimer', () => {
    render(<ResultScreen result={sampleResultWithData} />);

    expect(screen.getByTestId('scorebarsList')).toBeTruthy();
    expect(screen.getByText('Произношение')).toBeTruthy();
    expect(screen.getByText('Словарь')).toBeTruthy();
    expect(screen.getByText('Грамматика')).toBeTruthy();
    expect(screen.getByText('Взаимодействие')).toBeTruthy();

    expect(
      screen.getByText('Оценка ориентировочная, это тренажёр, а не экзамен.')
    ).toBeTruthy();
  });

  it('renders «Слишком мало ответов для оценки» when fewer than 3 answers are given', () => {
    const tooLittleData: PracticeResultData = {
      ...sampleResultWithData,
      learnerTurnCount: 1,
      hasEnoughData: false,
      criteria: {
        uttale: null,
        ordforrad: null,
        grammatikk: null,
        samhandling: null
      }
    };

    render(<ResultScreen result={tooLittleData} />);

    expect(screen.queryByTestId('scorebarsList')).toBeNull();
    expect(screen.getByTestId('tooFewAnswersCard')).toBeTruthy();
    expect(screen.getByText('Слишком мало ответов для оценки')).toBeTruthy();
    expect(
      screen.getByText('Оценка ориентировочная, это тренажёр, а не экзамен.')
    ).toBeTruthy();
  });

  it('renders «Что улучшить» items with error type, rule name, diff, and explanation', () => {
    const { container } = render(<ResultScreen result={sampleResultWithData} />);

    expect(screen.getByTestId('resultImprovementsSection')).toBeTruthy();
    expect(screen.getByText('Порядок слов')).toBeTruthy();
    expect(screen.getByText('Правило V2')).toBeTruthy();
    expect(screen.getByText('Глагол должен стоять на 2-м месте.')).toBeTruthy();

    const del = container.querySelector('del.practice-del');
    expect(del?.textContent).toBe('I dag jeg jobber');

    const ins = container.querySelector('ins.practice-ins');
    expect(ins?.textContent).toBe('I dag jobber jeg');
  });

  it('renders «Слова для повторения» and clicking «Добавить» saves word to personal deck', () => {
    render(<ResultScreen result={sampleResultWithData} />);

    expect(screen.getByTestId('resultWordsSection')).toBeTruthy();
    expect(screen.getByText('sykehus')).toBeTruthy();
    expect(screen.getByText('больница')).toBeTruthy();

    const addBtns = screen.getAllByRole('button', { name: /Добавить слово/i });
    expect(addBtns.length).toBe(2);

    // Click «Добавить» on first word (sykehus)
    fireEvent.click(addBtns[0]);

    // Check that button updates to «Добавлено» and is disabled
    expect(screen.getByRole('button', { name: /Слово «sykehus» добавлено в словарь/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Слово «sykehus» добавлено в словарь/i })).toHaveProperty('disabled', true);

    // Verify word was persisted to norsklive_words localStorage
    const wordsProgress = readWordsProgress();
    expect(wordsProgress.cards['sykehus']).toBeDefined();
    expect(wordsProgress.cards['sykehus'].wordId).toBe('sykehus');
  });

  it('renders action buttons: filled «На главную», outline «Пройти ещё раз», text «Скачать отчёт»', () => {
    const clickSpy = vi.fn();
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-report');
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    render(<ResultScreen result={sampleResultWithData} />);

    const homeLink = screen.getByRole('link', { name: 'На главную' });
    expect(homeLink.className).toContain('practice-filled-btn');
    expect(homeLink.getAttribute('href')).toBe('/');

    const replayLink = screen.getByRole('link', { name: 'Пройти ещё раз' });
    expect(replayLink.className).toContain('practice-outline-btn');
    expect(replayLink.getAttribute('href')).toBe('/practice');

    const downloadBtn = screen.getByRole('button', { name: /Скачать отчёт/i });
    expect(downloadBtn.className).toContain('practice-text-btn');

    // Trigger download
    fireEvent.click(downloadBtn);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('persistence: savePracticeResult and readPracticeResult survive reload', () => {
    expect(readPracticeResult()).toBeNull();

    savePracticeResult(sampleResultWithData);

    const restored = readPracticeResult();
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe('test-session-1');
    expect(restored?.learnerTurnCount).toBe(4);
    expect(restored?.criteria.grammatikk).toBe('A2');

    clearPracticeResult();
    expect(readPracticeResult()).toBeNull();
  });

  it('renders header with «Итог · <Тема>» format', () => {
    render(<ResultScreen result={sampleResultWithData} />);
    expect(screen.getByText('Итог · Работа')).toBeTruthy();
  });
});

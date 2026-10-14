// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FeedbackCard } from '../src/components/practice/FeedbackCard';
import type { CoachFeedback } from '../src/server/schemas';

describe('FeedbackCard («Разбор» card, Issue #54)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders status=ok: «Хорошо!», praise_l1, nothing struck out, filled «Дальше»', () => {
    const feedback: CoachFeedback = {
      status: 'ok',
      errors: [],
      praise_l1: 'Отличная фраза, глагол на втором месте!',
      level_estimate: 'B1'
    };

    const handleNext = vi.fn();
    const handleSpeak = vi.fn();

    const { container } = render(
      <FeedbackCard
        feedback={feedback}
        learnerText="Jeg bor i Bergen og jobber her."
        onNext={handleNext}
        onSpeak={handleSpeak}
      />
    );

    expect(screen.getByTestId('feedbackOk')).toBeTruthy();
    expect(screen.getByText('Хорошо!')).toBeTruthy();
    expect(screen.getByText('Отличная фраза, глагол на втором месте!')).toBeTruthy();

    // No <del> tag
    expect(container.querySelectorAll('del').length).toBe(0);

    // Only one filled button «Дальше»
    const nextBtn = screen.getByRole('button', { name: 'Дальше' });
    expect(nextBtn.className).toContain('practice-filled-btn');

    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('renders status=has_errors with one error: sentence with <del> and <ins>, rule name, «Почему?» accordion, «Слушать»', () => {
    const feedback: CoachFeedback = {
      status: 'has_errors',
      errors: [
        {
          quote: 'I dag jeg liker',
          fix: 'I dag liker jeg',
          type: 'word_order',
          rule_name_l1: 'Порядок слов (V2)',
          explanation_l1: 'В норвежском языке сказуемое всегда занимает второе место.'
        }
      ],
      praise_l1: 'Хорошая мысль!',
      level_estimate: 'A2'
    };

    const handleNext = vi.fn();
    const handleRepeat = vi.fn();
    const handleSpeak = vi.fn();

    const { container } = render(
      <FeedbackCard
        feedback={feedback}
        learnerText="I dag jeg liker å spise kake."
        onNext={handleNext}
        onRepeat={handleRepeat}
        onSpeak={handleSpeak}
      />
    );

    expect(screen.getByTestId('feedbackErrors')).toBeTruthy();

    const del = container.querySelector('del.practice-del');
    expect(del).toBeTruthy();
    expect(del?.textContent).toBe('I dag jeg liker');

    const ins = container.querySelector('ins.practice-ins');
    expect(ins).toBeTruthy();
    expect(ins?.textContent).toBe('I dag liker jeg');

    expect(screen.getByText('Порядок слов (V2)')).toBeTruthy();

    // Explanation is collapsed initially
    expect(screen.queryByTestId('feedbackExplanation')).toBeNull();
    const whyBtn = screen.getByRole('button', { name: /Почему\?/i });
    expect(whyBtn.getAttribute('aria-expanded')).toBe('false');

    // Expand «Почему?»
    fireEvent.click(whyBtn);
    expect(whyBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('feedbackExplanation')).toBeTruthy();
    expect(screen.getByText(/сказуемое всегда занимает второе место/i)).toBeTruthy();

    // Collapse «Почему?»
    fireEvent.click(whyBtn);
    expect(whyBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('feedbackExplanation')).toBeNull();

    // «Слушать исправление» button speaks corrected sentence
    const listenFixBtn = screen.getByRole('button', { name: 'Слушать исправление' });
    fireEvent.click(listenFixBtn);
    expect(handleSpeak).toHaveBeenCalledWith('I dag liker jeg å spise kake.');

    // Action buttons: filled «Дальше» and outline «Повторить фразу»
    const nextBtn = screen.getByRole('button', { name: 'Дальше' });
    expect(nextBtn.className).toContain('practice-filled-btn');
    const repeatBtn = screen.getByRole('button', { name: 'Повторить фразу' });
    expect(repeatBtn.className).toContain('practice-outline-btn');

    fireEvent.click(repeatBtn);
    expect(handleRepeat).toHaveBeenCalledTimes(1);
  });

  it('renders multiple errors with «Ещё N замечания» accordion and «Как сказать лучше»', () => {
    const feedback: CoachFeedback = {
      status: 'has_errors',
      errors: [
        {
          quote: 'I dag jeg liker',
          fix: 'I dag liker jeg',
          type: 'word_order',
          rule_name_l1: 'Порядок слов (V2)',
          explanation_l1: 'Инверсия после обстоятельства времени.'
        },
        {
          quote: 'en hus',
          fix: 'et hus',
          type: 'article',
          rule_name_l1: 'Артикль среднего рода',
          explanation_l1: 'Слово hus среднего рода.'
        }
      ],
      better_version: 'I dag foretrekker jeg å spise kake.',
      praise_l1: 'Хорошая мысль!',
      level_estimate: 'A2'
    };

    const handleSpeak = vi.fn();

    render(
      <FeedbackCard
        feedback={feedback}
        learnerText="I dag jeg liker en hus."
        onNext={vi.fn()}
        onRepeat={vi.fn()}
        onSpeak={handleSpeak}
      />
    );

    // «Ещё 1 замечание» is present and collapsed
    expect(screen.queryByTestId('feedbackMoreList')).toBeNull();
    const moreBtn = screen.getByRole('button', { name: /Ещё 1 замечание/i });
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(moreBtn);
    expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('feedbackMoreList')).toBeTruthy();
    expect(screen.getByText('Артикль среднего рода')).toBeTruthy();

    // «Как сказать лучше» is present and collapsed
    expect(screen.queryByTestId('feedbackBetterBody')).toBeNull();
    const betterBtn = screen.getByRole('button', { name: /Как сказать лучше/i });
    expect(betterBtn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(betterBtn);
    expect(betterBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('feedbackBetterBody')).toBeTruthy();
    expect(screen.getByText('I dag foretrekker jeg å spise kake.')).toBeTruthy();

    const listenBetterBtn = screen.getByRole('button', { name: 'Слушать лучший вариант' });
    fireEvent.click(listenBetterBtn);
    expect(handleSpeak).toHaveBeenCalledWith('I dag foretrekker jeg å spise kake.');
  });
});

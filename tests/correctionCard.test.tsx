// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CorrectionCard } from '../src/components/studio/CorrectionCard';
import type { CoachFeedback } from '../src/server/schemas';

describe('CorrectionCard (Issue #49 feedback schema & UI)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders status='ok': shows «Хорошо!», praise_l1, nothing struck out, no <del> tag", () => {
    const feedback: CoachFeedback = {
      status: 'ok',
      errors: [],
      praise_l1: 'Отличная фраза, всё грамматически верно!',
      level_estimate: 'B1'
    };

    const { container } = render(
      <CorrectionCard feedback={feedback} onSpeak={vi.fn()} />
    );

    expect(screen.getByTestId('correctionOk')).toBeTruthy();
    expect(screen.getByText('Хорошо!')).toBeTruthy();
    expect(screen.getByText('Отличная фраза, всё грамматически верно!')).toBeTruthy();

    const delElements = container.querySelectorAll('del');
    expect(delElements.length).toBe(0);
    const insElements = container.querySelectorAll('ins');
    expect(insElements.length).toBe(0);
  });

  it("renders status='has_errors' with 1 error: shows big diff with <del> and <ins>, rule name, «Почему?» button that expands explanation", () => {
    const feedback: CoachFeedback = {
      status: 'has_errors',
      errors: [
        {
          quote: 'I dag jeg liker',
          fix: 'I dag liker jeg',
          type: 'word_order',
          rule_name_l1: 'Правило V2',
          explanation_l1: 'В норвежском языке обстоятельство в начале предложения требует инверсии: глагол стоит на 2-м месте.'
        }
      ],
      praise_l1: 'Хорошая попытка!',
      level_estimate: 'A2'
    };

    const { container } = render(
      <CorrectionCard feedback={feedback} onSpeak={vi.fn()} />
    );

    const delEl = container.querySelector('del.correction-del');
    expect(delEl?.textContent).toBe('I dag jeg liker');

    const insEl = container.querySelector('ins.correction-ins');
    expect(insEl?.textContent).toBe('I dag liker jeg');

    expect(screen.getByText('Правило V2')).toBeTruthy();

    // Explanation is initially collapsed
    expect(screen.queryByTestId('correctionExplanation')).toBeNull();

    const whyBtn = screen.getByRole('button', { name: /Почему\?/i });
    expect(whyBtn.getAttribute('aria-expanded')).toBe('false');

    // Expand "Почему?"
    fireEvent.click(whyBtn);
    expect(whyBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('correctionExplanation')).toBeTruthy();
    expect(screen.getByText(/обстоятельство в начале предложения требует инверсии/i)).toBeTruthy();

    // Collapse "Почему?"
    fireEvent.click(whyBtn);
    expect(whyBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('correctionExplanation')).toBeNull();
  });

  it("renders status='has_errors' with 2+ errors: shows first error big, second under «Ещё 1» expandable accordion", () => {
    const feedback: CoachFeedback = {
      status: 'has_errors',
      errors: [
        {
          quote: 'I dag jeg liker',
          fix: 'I dag liker jeg',
          type: 'word_order',
          rule_name_l1: 'Правило V2',
          explanation_l1: 'Инверсия после обстоятельства времени.'
        },
        {
          quote: 'en hus',
          fix: 'et hus',
          type: 'article',
          rule_name_l1: 'Род существительного',
          explanation_l1: 'Слово hus среднего рода (et hus).'
        }
      ],
      praise_l1: 'Понятный ответ, но обрати внимание на ошибки.',
      level_estimate: 'A2'
    };

    const { container } = render(
      <CorrectionCard feedback={feedback} onSpeak={vi.fn()} />
    );

    // First error is big and visible
    expect(screen.getByText('Правило V2')).toBeTruthy();
    expect(container.querySelector('del.correction-del')?.textContent).toBe('I dag jeg liker');

    // Second error is initially hidden under «Ещё 1» button
    expect(screen.queryByText('Род существительного')).toBeNull();

    const moreBtn = screen.getByRole('button', { name: /Ещё 1/i });
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');

    // Expand «Ещё 1»
    fireEvent.click(moreBtn);
    expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Род существительного')).toBeTruthy();
    expect(screen.getByText('Слово hus среднего рода (et hus).')).toBeTruthy();

    // Verify both errors now visible in container
    const allDels = container.querySelectorAll('del.correction-del');
    expect(allDels.length).toBe(2);
    expect(allDels[1].textContent).toBe('en hus');

    const allInses = container.querySelectorAll('ins.correction-ins');
    expect(allInses.length).toBe(2);
    expect(allInses[1].textContent).toBe('et hus');
  });

  it('renders better_version under «Как сказать лучше» accordion and handles speech', () => {
    const onSpeak = vi.fn();
    const feedback: CoachFeedback = {
      status: 'ok',
      errors: [],
      praise_l1: 'Хороший аргумент!',
      level_estimate: 'B1',
      better_version: 'Etter min mening er miljøvern avgjørende for fremtiden.'
    };

    render(
      <CorrectionCard feedback={feedback} showTry={true} onSpeak={onSpeak} />
    );

    // Initially collapsed
    expect(screen.queryByTestId('correctionTry')).toBeNull();

    const betterBtn = screen.getByRole('button', { name: /Как сказать лучше/i });
    expect(betterBtn.getAttribute('aria-expanded')).toBe('false');

    // Expand
    fireEvent.click(betterBtn);
    expect(betterBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('correctionTry')).toBeTruthy();
    expect(screen.getByText('Etter min mening er miljøvern avgjørende for fremtiden.')).toBeTruthy();

    // Click listen button
    const listenBtn = screen.getByRole('button', { name: /Прослушать/i });
    fireEvent.click(listenBtn);
    expect(onSpeak).toHaveBeenCalledWith('Etter min mening er miljøvern avgjørende for fremtiden.');
  });

  it('does NOT render «Как сказать лучше» when showTry=false (exam mode)', () => {
    const feedback: CoachFeedback = {
      status: 'ok',
      errors: [],
      praise_l1: 'Хороший аргумент!',
      level_estimate: 'B1',
      better_version: 'Etter min mening er miljøvern avgjørende for fremtiden.'
    };

    render(
      <CorrectionCard feedback={feedback} showTry={false} onSpeak={vi.fn()} />
    );

    expect(screen.queryByRole('button', { name: /Как сказать лучше/i })).toBeNull();
    expect(screen.queryByTestId('correctionTry')).toBeNull();
  });
});

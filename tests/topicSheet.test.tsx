// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { TopicSheet, EXAM_TOPICS } from '../src/components/practice/TopicSheet';

describe('TopicSheet Component (Issue #56)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  test('1. Renders 7 exam topics as rows with scenario counts for given level and l1', () => {
    const onSelectTopic = vi.fn();
    const onClose = vi.fn();

    render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={onSelectTopic}
        targetLevel="B1"
        l1="ru"
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Выбор темы' });
    expect(dialog).toBeTruthy();

    // Check all 7 topics are rendered
    expect(EXAM_TOPICS).toHaveLength(7);
    for (const topic of EXAM_TOPICS) {
      const topicBtn = screen.getByRole('button', { name: topic.titleRu });
      expect(topicBtn).toBeTruthy();
      expect(topicBtn.getAttribute('data-topic')).toBe(topic.id);
    }

    // Selected topic is arbeid
    const arbeidBtn = screen.getByRole('button', { name: 'Работа' });
    expect(arbeidBtn.className).toContain('is-selected');

    // Scenario count is displayed
    expect(arbeidBtn.textContent).toContain('сценари');
  });

  test('2. Selecting a topic fires onSelectTopic and onClose', () => {
    const onSelectTopic = vi.fn();
    const onClose = vi.fn();

    render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={onSelectTopic}
        targetLevel="B1"
        l1="ru"
      />
    );

    const helseBtn = screen.getByRole('button', { name: 'Врач' });
    fireEvent.click(helseBtn);

    expect(onSelectTopic).toHaveBeenCalledWith('helse');
    expect(onClose).toHaveBeenCalled();
  });

  test('3. Mode selector toggles between «Учёба» and «Экзамен»', () => {
    const onChangeMode = vi.fn();

    render(
      <TopicSheet
        open={true}
        onClose={vi.fn()}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
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

  test('4. «Своя тема» expands, caps at 4 000 chars, shows disclaimer and applies text', () => {
    const onApplyCustomText = vi.fn();
    const onClose = vi.fn();

    render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
        onApplyCustomText={onApplyCustomText}
      />
    );

    const customToggleBtn = screen.getByRole('button', { name: 'Своя тема' });
    expect(customToggleBtn.getAttribute('aria-expanded')).toBe('false');

    // Click to expand
    fireEvent.click(customToggleBtn);
    expect(customToggleBtn.getAttribute('aria-expanded')).toBe('true');

    // Textarea is present with privacy note
    const textarea = screen.getByPlaceholderText(/Вставьте текст на норвежском/i) as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.maxLength).toBe(4000);

    expect(
      screen.getByText('Текст останется в браузере и уйдёт только для ответа')
    ).toBeTruthy();

    // Type text and verify counter
    fireEvent.change(textarea, { target: { value: 'Dette er min tilpassede tekst for øving.' } });
    expect(screen.getByText(/40 \/ 4000/)).toBeTruthy();

    // Start practice with custom text
    const startBtn = screen.getByRole('button', { name: 'Применить тему' });
    fireEvent.click(startBtn);

    expect(onApplyCustomText).toHaveBeenCalledWith('Dette er min tilpassede tekst for øving.');
    expect(onClose).toHaveBeenCalled();
  });

  test('5. Focus restoration and Escape key closes the sheet', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { rerender } = render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
      />
    );

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Rerender as closed to trigger focus restoration
    rerender(
      <TopicSheet
        open={false}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
      />
    );

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  test('6. Clicking scrim closes the sheet', () => {
    const onClose = vi.fn();

    const { container } = render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
      />
    );

    const scrim = container.querySelector('.topic-sheet-scrim') as HTMLElement;
    expect(scrim).toBeTruthy();
    fireEvent.click(scrim);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('7. Optional onFinishSession button calls onFinishSession and onClose', () => {
    const onFinish = vi.fn();
    const onClose = vi.fn();

    render(
      <TopicSheet
        open={true}
        onClose={onClose}
        selectedTopic="arbeid"
        onSelectTopic={vi.fn()}
        onFinishSession={onFinish}
      />
    );

    const finishBtn = screen.getByRole('button', { name: 'Завершить практику' });
    expect(finishBtn).toBeTruthy();

    fireEvent.click(finishBtn);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

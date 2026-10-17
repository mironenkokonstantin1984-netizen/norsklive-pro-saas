'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import './topicSheet.css';
import { scenariosByModule, type ScenarioTopic } from '../../content/scenarios';
import type { PathL1 } from '../../lib/path/storage';

export interface TopicSheetProps {
  open: boolean;
  onClose: () => void;
  selectedTopic?: string;
  onSelectTopic: (topicId: string) => void;
  targetLevel?: 'A2' | 'B1' | 'B2';
  l1?: PathL1;
  isExamMode?: boolean;
  onChangeMode?: (examMode: boolean) => void;
  onApplyCustomText?: (text: string) => void;
  onFinishSession?: () => void;
}


export interface ExamTopicItem {
  id: ScenarioTopic;
  titleRu: string;
  titleUk: string;
  titleEn: string;
}

export const EXAM_TOPICS: readonly ExamTopicItem[] = [
  { id: 'arbeid', titleRu: 'Работа', titleUk: 'Робота', titleEn: 'Work' },
  { id: 'bolig', titleRu: 'Жильё', titleUk: 'Житло', titleEn: 'Housing' },
  { id: 'helse', titleRu: 'Врач', titleUk: 'Лікар', titleEn: 'Doctor' },
  { id: 'familie', titleRu: 'Семья', titleUk: 'Сім’я', titleEn: 'Family' },
  { id: 'handel', titleRu: 'Магазин', titleUk: 'Магазин', titleEn: 'Shop' },
  { id: 'transport', titleUk: 'Транспорт', titleRu: 'Транспорт', titleEn: 'Transport' },
  { id: 'fritid', titleRu: 'Свободное время', titleUk: 'Вільний час', titleEn: 'Free time' }
];

export function getLocalizedTopicTitle(topicId: string, l1: PathL1 = 'ru'): string {
  const found = EXAM_TOPICS.find((t) => t.id === topicId);
  if (!found) return l1 === 'uk' ? 'Робота' : l1 === 'en' ? 'Work' : 'Работа';
  if (l1 === 'uk') return found.titleUk;
  if (l1 === 'en') return found.titleEn;
  return found.titleRu;
}

export function countScenariosForTopic(topicId: string, level: string = 'B1'): number {
  const norskproveScenarios = scenariosByModule.norskprove || [];
  const normalizedLevel = level === 'A2' ? 'A2' : 'B1';
  const matches = norskproveScenarios.filter(
    (s) => s.topic === topicId && s.level === normalizedLevel
  );
  return matches.length > 0 ? matches.length : 3;
}

export function formatScenarioCount(count: number, l1: PathL1 = 'ru'): string {
  if (l1 === 'en') {
    return `${count} ${count === 1 ? 'scenario' : 'scenarios'}`;
  }
  if (l1 === 'uk') {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} сценарій`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} сценарії`;
    return `${count} сценаріїв`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} сценарий`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} сценария`;
  return `${count} сценариев`;
}

export function TopicSheet({
  open,
  onClose,
  selectedTopic = 'arbeid',
  onSelectTopic,
  targetLevel = 'B1',
  l1 = 'ru',
  isExamMode = false,
  onChangeMode,
  onApplyCustomText,
  onFinishSession
}: TopicSheetProps) {
  const [customText, setCustomText] = useState('');
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Store previously focused element and restore it on close
  useEffect(() => {
    if (open) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      // Focus close button on mount
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [open]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleSelectTopicItem = useCallback(
    (topicId: ScenarioTopic) => {
      onSelectTopic(topicId);
      onClose();
    },
    [onSelectTopic, onClose]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (onApplyCustomText) {
      onApplyCustomText(trimmed);
    }
    setCustomText('');
    onClose();
  }, [customText, onApplyCustomText, onClose]);

  if (!open) return null;

  return (
    <div
      className="topic-sheet-backdrop topic-sheet-scrim"
      data-testid="topicSheetBackdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className="topic-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topicSheetTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="topic-sheet-header">
          <h2 id="topicSheetTitle" className="topic-sheet-title t-title">
            {l1 === 'uk' ? 'Вибір теми' : l1 === 'en' ? 'Select Topic' : 'Выбор темы'}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn-text topic-sheet-close-btn t-callout"
            onClick={onClose}
            aria-label={l1 === 'uk' ? 'Закрити' : l1 === 'en' ? 'Close' : 'Закрыть'}
          >
            <X size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            <span>{l1 === 'uk' ? 'Закрити' : l1 === 'en' ? 'Close' : 'Закрыть'}</span>
          </button>
        </div>

        <div className="topic-sheet-body">
          {/* List of 7 exam topics as large rows (>= 56px) */}
          <div className="topic-sheet-list" role="list" aria-label="Темы экзамена">
            {EXAM_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              const count = countScenariosForTopic(topic.id, targetLevel);
              const countLabel = formatScenarioCount(count, l1);
              const title = getLocalizedTopicTitle(topic.id, l1);

              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-label={title}
                  className={`topic-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectTopicItem(topic.id)}
                  data-topic={topic.id}
                >
                  <div className="topic-row-info">
                    <span className="topic-row-title t-callout">{title}</span>
                    <span className="topic-row-count t-caption" aria-hidden="true">{countLabel}</span>
                  </div>
                  {isSelected ? (
                    <span className="topic-row-check" aria-hidden="true">
                      <Check size={20} strokeWidth={2} color="currentColor" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* «Своя тема» collapsible / textarea block up to 4 000 chars */}
          <div className="topic-custom-section">
            <button
              type="button"
              className="btn-text topic-custom-toggle-btn t-callout"
              onClick={() => setIsCustomExpanded((prev) => !prev)}
              aria-expanded={isCustomExpanded}
              aria-controls="topicCustomContent"
            >
              {l1 === 'uk' ? 'Своя тема' : l1 === 'en' ? 'Custom Topic' : 'Своя тема'}
            </button>

            {isCustomExpanded ? (
              <div id="topicCustomContent" className="topic-custom-content">
                <label htmlFor="topicCustomText" className="sr-only">
                  {l1 === 'uk'
                    ? 'Введіть власний текст або опис вакансії'
                    : l1 === 'en'
                      ? 'Enter custom text or job vacancy description'
                      : 'Введите свой текст или описание вакансии'}
                </label>
                <textarea
                  id="topicCustomText"
                  className="topic-custom-textarea t-body"
                  rows={4}
                  maxLength={4000}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={
                    l1 === 'uk'
                      ? 'Вставте текст норвезькою (до 4 000 символів)...'
                      : l1 === 'en'
                        ? 'Paste Norwegian text (up to 4,000 characters)...'
                        : 'Вставьте текст на норвежском (до 4 000 знаков)...'
                  }
                />
                <div className="topic-custom-meta">
                  <p className="topic-custom-note t-caption">
                    Текст останется в браузере и уйдёт только для ответа
                  </p>
                  <span className="topic-custom-counter t-caption">
                    {customText.length} / 4000
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-outline topic-custom-apply-btn t-callout"
                  disabled={!customText.trim()}
                  onClick={handleCustomSubmit}
                >
                  {l1 === 'uk' ? 'Застосувати тему' : l1 === 'en' ? 'Apply topic' : 'Применить тему'}
                </button>
              </div>
            ) : null}
          </div>

          {/* Two-option control «Учёба | Экзамен» (default «Учёба») */}
          <div className="topic-mode-control-wrap">
            <span className="topic-mode-label t-caption">
              {l1 === 'uk' ? 'Режим практики' : l1 === 'en' ? 'Practice mode' : 'Режим практики'}
            </span>
            <div
              className="topic-mode-control segmented-control"
              role="radiogroup"
              aria-label="Режим практики"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!isExamMode}
                className={`topic-mode-btn t-callout ${!isExamMode ? 'is-active' : ''}`}
                onClick={() => onChangeMode && onChangeMode(false)}
              >
                {l1 === 'uk' ? 'Навчання' : l1 === 'en' ? 'Study' : 'Учёба'}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isExamMode}
                className={`topic-mode-btn t-callout ${isExamMode ? 'is-active' : ''}`}
                onClick={() => onChangeMode && onChangeMode(true)}
              >
                {l1 === 'uk' ? 'Іспит' : l1 === 'en' ? 'Exam' : 'Экзамен'}
              </button>
            </div>
          </div>

          {/* Optional finish practice button when called from practice screen */}
          {onFinishSession ? (
            <div className="topic-finish-section">
              <button
                type="button"
                className="btn-outline topic-finish-btn t-callout"
                onClick={() => {
                  onClose();
                  onFinishSession();
                }}
              >
                {isExamMode
                  ? l1 === 'uk' ? 'Завершити частину' : l1 === 'en' ? 'Finish part' : 'Завершить часть'
                  : l1 === 'uk' ? 'Завершити практику' : l1 === 'en' ? 'Finish practice' : 'Завершить практику'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


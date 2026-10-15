'use client';

import React, { useState, useCallback } from 'react';
import { Download, Plus, Check } from 'lucide-react';
import { ScoreBar } from '../studio/ScoreBar';
import {
  type PracticeResultData,
  addWordToDeck,
  buildPracticeResultMarkdown
} from '../../lib/practice/resultData';
import './practice.css';

export interface ResultScreenProps {
  result: PracticeResultData;
}

export function ResultScreen({ result }: ResultScreenProps) {
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  const topicName =
    result.isExam && result.examPart
      ? `Часть ${result.examPart}`
      : result.topicTitle ||
        (result.module === 'jobbintervju'
          ? 'Собеседование'
          : result.module === 'pensum'
            ? 'Пенсум'
            : 'Работа');

  const handleAddWord = useCallback((wordId: string) => {
    addWordToDeck(wordId);
    setAddedWords((prev) => new Set([...prev, wordId]));
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (typeof window === 'undefined') return;
    const markdown = buildPracticeResultMarkdown(result);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NorskLive-Result-${result.scenarioId || 'session'}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }, [result]);

  return (
    <div className="practice-shell practice-result-shell" data-testid="practiceResultScreen">
      {/* Top Header */}
      <header className="practice-header topbar" role="banner">
        <a href="/" className="practice-back-btn" aria-label="Назад">
          ‹
        </a>
        <div className="practice-header-center">
          <span className="practice-header-title t-callout">
            Итог · {topicName}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="practice-main practice-result-main" role="main">
        <h1 className="practice-result-heading t-title">
          {result.isExam && result.examPart
            ? `Итог части ${result.examPart}`
            : 'Итог практики'}
        </h1>

        {/* SECTION 1: CRITERIA SCORES */}
        <section
          className="practice-result-section practice-result-card"
          aria-labelledby="criteriaHeading"
          data-testid="resultScoresSection"
        >
          <h2 id="criteriaHeading" className="practice-result-section-title t-callout">
            Оценка по критериям HK-dir
          </h2>

          {result.hasEnoughData ? (
            <div className="practice-scorebars-list" data-testid="scorebarsList">
              <ScoreBar label="Произношение" level={result.criteria.uttale} />
              <ScoreBar label="Словарь" level={result.criteria.ordforrad} />
              <ScoreBar label="Грамматика" level={result.criteria.grammatikk} />
              <ScoreBar label="Взаимодействие" level={result.criteria.samhandling} />
            </div>
          ) : (
            <div className="practice-too-few-answers" data-testid="tooFewAnswersCard">
              <p className="t-body">Слишком мало ответов для оценки</p>
            </div>
          )}

          <p className="practice-result-note t-caption">
            Оценка ориентировочная, это тренажёр, а не экзамен.
          </p>
        </section>

        {/* SECTION 2: ЧТО УЛУЧШИТЬ (1-3 items) */}
        {result.improvements.length > 0 && (
          <section
            className="practice-result-section practice-result-card"
            aria-labelledby="improveHeading"
            data-testid="resultImprovementsSection"
          >
            <h2 id="improveHeading" className="practice-result-section-title t-callout">
              Что улучшить
            </h2>

            <div className="practice-improvements-list">
              {result.improvements.map((item, idx) => (
                <div key={`${idx}-${item.type}`} className="practice-improvement-item">
                  <div className="practice-improvement-header">
                    <span className="practice-improvement-type t-caption">
                      {item.typeTitle}
                    </span>
                    <span className="practice-improvement-rule t-callout">
                      {item.ruleName}
                    </span>
                  </div>

                  {item.quote && item.fix && (
                    <div className="practice-improvement-diff t-speech" lang="nb">
                      <del className="practice-del">{item.quote}</del>
                      <span className="practice-diff-arrow" aria-hidden="true"> → </span>
                      <ins className="practice-ins">{item.fix}</ins>
                    </div>
                  )}

                  <p className="practice-improvement-desc t-body">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: СЛОВА ДЛЯ ПОВТОРЕНИЯ */}
        {result.stumbledWords.length > 0 && (
          <section
            className="practice-result-section practice-result-card"
            aria-labelledby="wordsHeading"
            data-testid="resultWordsSection"
          >
            <h2 id="wordsHeading" className="practice-result-section-title t-callout">
              Слова для повторения
            </h2>

            <div className="practice-stumbled-words-list">
              {result.stumbledWords.map((word) => {
                const isAdded = addedWords.has(word.id);
                return (
                  <div key={word.id} className="practice-stumbled-word-item">
                    <div className="practice-stumbled-word-info">
                      <span className="practice-stumbled-word-nb t-callout" lang="nb">
                        {word.word}
                      </span>
                      {word.translation && (
                        <span className="practice-stumbled-word-trans t-caption">
                          {word.translation}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`practice-add-word-btn t-callout ${isAdded ? 'is-added' : ''}`}
                      onClick={() => handleAddWord(word.id)}
                      disabled={isAdded}
                      aria-label={
                        isAdded
                          ? `Слово «${word.word}» добавлено в словарь`
                          : `Добавить слово «${word.word}» в словарь`
                      }
                    >
                      {isAdded ? (
                        <>
                          <Check size={18} aria-hidden="true" />
                          <span>Добавлено</span>
                        </>
                      ) : (
                        <>
                          <Plus size={18} aria-hidden="true" />
                          <span>Добавить</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ACTIONS: ONE FILLED «На главную», OUTLINE «Пройти ещё раз», TEXT «Скачать отчёт» */}
        <section className="practice-result-actions" aria-label="Действия">
          <a
            href="/"
            className="practice-filled-btn practice-result-primary-btn t-callout"
          >
            На главную
          </a>

          <a
            href={`/practice${result.isExam ? '?mode=exam' : ''}`}
            className="practice-outline-btn practice-result-secondary-btn t-callout"
          >
            Пройти ещё раз
          </a>

          <button
            type="button"
            className="practice-text-btn practice-result-download-btn t-callout"
            onClick={handleDownloadReport}
          >
            <Download size={18} aria-hidden="true" />
            <span>Скачать отчёт</span>
          </button>
        </section>
      </main>
    </div>
  );
}

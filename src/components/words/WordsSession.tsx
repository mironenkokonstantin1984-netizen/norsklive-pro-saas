'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { readPathPrefs, type PathL1 } from '../../lib/path/storage';
import { speakNorwegian } from '../../lib/speech';
import { DRAFT_WORD_LABEL } from '../../lib/words/catalog';
import type { WordItem } from '../../lib/words/schema';
import {
  buildDailySession,
  countKnownWords,
  readWordsProgress,
  writeWordsProgress,
  type SessionQueueItem,
  type WordsProgressData
} from '../../lib/words/progress';
import {
  checkStage3Answer,
  checkStage4Answer,
  completeIntroStage,
  getCanonicalDisplayLemma,
  getStage3Hint,
  gradeWordCard,
  updateAdaptiveState,
  type WordGrade
} from '../../lib/words/scheduler';

export interface WordsSessionProps {
  catalog: WordItem[];
  showDrafts: boolean;
  initialLimit?: number;
}

function getL1Text(
  translations: { ru: string; uk: string; en: string },
  l1: PathL1
): string {
  return translations[l1] || translations.ru;
}

function getClozeHintL1(
  cloze: { hint_ru?: string; hint_uk?: string; hint_en?: string },
  l1: PathL1
): string {
  if (l1 === 'uk') return cloze.hint_uk || cloze.hint_ru || '';
  if (l1 === 'en') return cloze.hint_en || cloze.hint_ru || '';
  return cloze.hint_ru || '';
}

function formatFormsLine(item: WordItem): string {
  return Object.values(item.forms).join(' · ');
}

export function WordsSession({ catalog, showDrafts, initialLimit }: WordsSessionProps) {
  const [l1, setL1] = useState<PathL1>('ru');
  const [progress, setProgress] = useState<WordsProgressData | null>(null);
  const [queue, setQueue] = useState<SessionQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stage 2 state
  const [stage2Revealed, setStage2Revealed] = useState(false);

  // Stage 3 & Stage 4 state
  const [typedInput, setTypedInput] = useState('');
  const [checkResult, setCheckResult] = useState<{
    correct: boolean;
    expected: string;
    submitted: string;
    hintL1?: string;
  } | null>(null);

  // Session counters for summary
  const [newIntroducedCount, setNewIntroducedCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [reachedContextCount, setReachedContextCount] = useState(0);

  useEffect(() => {
    const pathPrefs = readPathPrefs();
    setL1(pathPrefs.l1 ?? 'ru');

    const loadedProgress = readWordsProgress();
    setProgress(loadedProgress);

    const plan = buildDailySession(new Date(), catalog, loadedProgress);
    const initialQueue =
      typeof initialLimit === 'number' && initialLimit > 0
        ? plan.queue.slice(0, initialLimit)
        : plan.queue;
    setQueue(initialQueue);
    setCurrentIndex(0);
  }, [catalog, initialLimit]);

  const currentEntry = queue[currentIndex] ?? null;

  const resetCardInteractionState = () => {
    setStage2Revealed(false);
    setTypedInput('');
    setCheckResult(null);
  };

  const currentCloze = useMemo(() => {
    if (!currentEntry) return null;
    const clozes = currentEntry.item.cloze;
    const idx = currentEntry.card.clozeIndex % clozes.length;
    return clozes[idx] ?? clozes[0];
  }, [currentEntry]);

  if (!progress) {
    return null;
  }

  const totalCatalogCount = catalog.length;
  const knownTotalCount = countKnownWords(progress, catalog);
  const isFinished = currentIndex >= queue.length;

  const handleStage1Next = () => {
    if (!currentEntry) return;
    const now = new Date();
    const updatedCard = completeIntroStage(currentEntry.card, now);
    const nextProgress: WordsProgressData = {
      ...progress,
      cards: {
        ...progress.cards,
        [currentEntry.item.id]: updatedCard
      }
    };
    setProgress(nextProgress);
    writeWordsProgress(nextProgress);
    setNewIntroducedCount((c) => c + 1);

    // Append the card at stage 2 so the learner recalls it in the same daily session
    setQueue((prev) => [
      ...prev,
      {
        item: currentEntry.item,
        card: updatedCard,
        isNew: false
      }
    ]);
    resetCardInteractionState();
    setCurrentIndex((idx) => idx + 1);
  };

  const handleGrade = (grade: WordGrade) => {
    if (!currentEntry) return;
    const now = new Date();
    const wasStage = currentEntry.card.stage;
    const typedCorrect = checkResult ? checkResult.correct : undefined;
    const outcomeCorrect =
      typedCorrect !== undefined ? typedCorrect && grade !== 'again' : grade !== 'again';

    const nextCard = gradeWordCard(currentEntry.card, grade, now, { typedCorrect });
    if (wasStage === 4) {
      nextCard.clozeIndex = (currentEntry.card.clozeIndex + 1) % currentEntry.item.cloze.length;
    }

    const nextAdaptive = updateAdaptiveState(progress.adaptive, outcomeCorrect);
    const nextProgress: WordsProgressData = {
      cards: {
        ...progress.cards,
        [currentEntry.item.id]: nextCard
      },
      adaptive: nextAdaptive
    };

    setProgress(nextProgress);
    writeWordsProgress(nextProgress);
    setReviewedCount((c) => c + 1);

    if (nextCard.stage >= 4 && (wasStage < 4 || wasStage === 4)) {
      setReachedContextCount((c) => c + 1);
    }

    resetCardInteractionState();
    setCurrentIndex((idx) => idx + 1);
  };

  const handleStage3Submit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentEntry || checkResult) return;
    const res = checkStage3Answer(currentEntry.item, typedInput);
    setCheckResult({
      correct: res.correct,
      expected: res.expected,
      submitted: typedInput.trim()
    });
  };

  const handleStage4Submit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentEntry || !currentCloze || checkResult) return;
    const res = checkStage4Answer(currentCloze, typedInput);
    setCheckResult({
      correct: res.correct,
      expected: res.expected,
      submitted: typedInput.trim(),
      hintL1: getClozeHintL1(currentCloze, l1)
    });
  };

  return (
    <main className="words-page" id="wordsPage">
      <div className="words-container">
        <header className="words-header">
          <a href="/path" className="btn-outline words-back-link">
            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>Мой путь</span>
          </a>
          <div className="words-progress-meta t-caption t-num">
            {!isFinished
              ? `Карточка ${currentIndex + 1} из ${queue.length}`
              : 'Сессия завершена'}
          </div>
        </header>

        {isFinished ? (
          <section
            className="words-card words-summary-card"
            data-testid="wordsSummary"
            aria-labelledby="wordsSummaryHeading"
          >
            <h1 id="wordsSummaryHeading" className="t-h1 words-card-heading">
              Итог на сегодня
            </h1>
            <p className="t-body words-summary-line t-num" data-testid="wordsSummaryLine">
              {`Сегодня: ${newIntroducedCount} новых, ${reviewedCount} повторено, ${reachedContextCount} дошли до контекста. Вы знаете ${knownTotalCount} из ${totalCatalogCount} слов`}
            </p>
            <div className="words-actions-row">
              <a href="/path" className="btn-primary words-primary-action">
                Вернуться на главную
              </a>
            </div>
          </section>
        ) : currentEntry ? (
          <section
            className="words-card"
            data-testid={`wordsStage${currentEntry.card.stage}`}
            aria-live="polite"
          >
            <div className="words-card-top">
              <span className="words-stage-badge t-caption">
                {`Ступень ${currentEntry.card.stage} из 4 · ${currentEntry.item.level}`}
              </span>
              {showDrafts || currentEntry.item.status === 'draft' ? (
                <span className="words-draft-caption t-caption" data-testid="wordsDraftLabel">
                  {DRAFT_WORD_LABEL}
                </span>
              ) : null}
            </div>

            {currentEntry.card.stage === 1 ? (
              <div className="words-stage-body">
                <div className="words-lemma-block">
                  <h1 className="t-h1 words-lemma-title">
                    {getCanonicalDisplayLemma(currentEntry.item)}
                  </h1>
                  <p className="t-caption words-forms-line">
                    {formatFormsLine(currentEntry.item)}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-outline words-audio-btn"
                  onClick={() => speakNorwegian(getCanonicalDisplayLemma(currentEntry.item))}
                >
                  <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>Прослушать</span>
                </button>

                <div className="words-translation-box">
                  <span className="t-caption words-box-label">Значение</span>
                  <p className="t-callout words-translation-text">
                    {getL1Text(currentEntry.item.translations, l1)}
                  </p>
                </div>

                {currentEntry.item.examples[0] ? (
                  <div className="words-example-box">
                    <span className="t-caption words-box-label">Пример</span>
                    <p className="t-speech words-example-nb">
                      {currentEntry.item.examples[0].nb}
                    </p>
                    <p className="t-body words-example-l1">
                      {getL1Text(currentEntry.item.examples[0], l1)}
                    </p>
                  </div>
                ) : null}

                <div className="words-actions-row">
                  <button
                    type="button"
                    className="btn-primary words-primary-action"
                    onClick={handleStage1Next}
                  >
                    Дальше
                  </button>
                </div>
              </div>
            ) : null}

            {currentEntry.card.stage === 2 ? (
              <div className="words-stage-body">
                <div className="words-lemma-block">
                  <span className="t-caption words-box-label">Вспомните значение</span>
                  <h1 className="t-h1 words-lemma-title">
                    {getCanonicalDisplayLemma(currentEntry.item)}
                  </h1>
                  <p className="t-caption words-forms-line">
                    {formatFormsLine(currentEntry.item)}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-outline words-audio-btn"
                  onClick={() => speakNorwegian(getCanonicalDisplayLemma(currentEntry.item))}
                >
                  <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>Прослушать</span>
                </button>

                {!stage2Revealed ? (
                  <div className="words-actions-row">
                    <button
                      type="button"
                      className="btn-primary words-primary-action"
                      onClick={() => setStage2Revealed(true)}
                    >
                      Показать ответ
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="words-translation-box" data-testid="stage2AnswerBox">
                      <span className="t-caption words-box-label">Ответ</span>
                      <p className="t-callout words-translation-text">
                        {getL1Text(currentEntry.item.translations, l1)}
                      </p>
                      {currentEntry.item.examples[0] ? (
                        <p className="t-body words-example-nb">
                          {currentEntry.item.examples[0].nb}
                        </p>
                      ) : null}
                    </div>

                    <div className="words-grade-grid" role="group" aria-label="Оцените ответ">
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('again')}
                      >
                        Не вспомнил
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('hard')}
                      >
                        Трудно
                      </button>
                      <button
                        type="button"
                        className="btn-primary words-grade-btn"
                        onClick={() => handleGrade('good')}
                      >
                        Нормально
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('easy')}
                      >
                        Легко
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {currentEntry.card.stage === 3 ? (
              <div className="words-stage-body">
                <div className="words-lemma-block">
                  <span className="t-caption words-box-label">
                    Напишите по-норвежски (существительные — с артиклем)
                  </span>
                  <h1 className="t-h1 words-lemma-title">
                    {getL1Text(currentEntry.item.translations, l1)}
                  </h1>
                </div>

                {(() => {
                  const hint = getStage3Hint(
                    currentEntry.item,
                    currentEntry.card,
                    progress.adaptive
                  );
                  return hint.text ? (
                    <div className="words-hint-pill t-caption" data-testid="stage3Hint">
                      {`Подсказка: ${hint.text}`}
                    </div>
                  ) : null;
                })()}

                <form className="words-input-form" onSubmit={handleStage3Submit}>
                  <input
                    type="text"
                    className="words-text-input t-body"
                    aria-label="Введите слово по-норвежски"
                    placeholder="Напишите ответ..."
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    disabled={Boolean(checkResult)}
                    autoComplete="off"
                    autoFocus
                  />
                  {!checkResult ? (
                    <button
                      type="submit"
                      className="btn-primary words-primary-action"
                      disabled={!typedInput.trim()}
                    >
                      Проверить
                    </button>
                  ) : null}
                </form>

                {checkResult ? (
                  <>
                    <div
                      className={`words-feedback-box ${
                        checkResult.correct ? 'words-feedback-ok' : 'words-feedback-err'
                      }`}
                      data-testid="stage3Feedback"
                    >
                      <p className="t-callout">
                        {checkResult.correct
                          ? `Верно: ${checkResult.expected}`
                          : `Правильный ответ: ${checkResult.expected}`}
                      </p>
                      <button
                        type="button"
                        className="btn-outline words-audio-btn"
                        onClick={() => speakNorwegian(checkResult.expected)}
                      >
                        <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                        <span>Прослушать</span>
                      </button>
                    </div>

                    <div className="words-grade-grid" role="group" aria-label="Оцените ответ">
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('again')}
                      >
                        Не вспомнил
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('hard')}
                      >
                        Трудно
                      </button>
                      <button
                        type="button"
                        className="btn-primary words-grade-btn"
                        onClick={() => handleGrade('good')}
                      >
                        Нормально
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('easy')}
                      >
                        Легко
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {currentEntry.card.stage >= 4 && currentCloze ? (
              <div className="words-stage-body">
                <div className="words-lemma-block">
                  <span className="t-caption words-box-label">
                    Вставьте слово в точной грамматической форме ({getL1Text(currentEntry.item.translations, l1)})
                  </span>
                  <h1 className="t-speech words-cloze-sentence" data-testid="stage4ClozeSentence">
                    {currentCloze.nb}
                  </h1>
                </div>

                <form className="words-input-form" onSubmit={handleStage4Submit}>
                  <input
                    type="text"
                    className="words-text-input t-body"
                    aria-label="Введите точную форму слова"
                    placeholder="Точная форма..."
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    disabled={Boolean(checkResult)}
                    autoComplete="off"
                    autoFocus
                  />
                  {!checkResult ? (
                    <button
                      type="submit"
                      className="btn-primary words-primary-action"
                      disabled={!typedInput.trim()}
                    >
                      Проверить
                    </button>
                  ) : null}
                </form>

                {checkResult ? (
                  <>
                    <div
                      className={`words-feedback-box ${
                        checkResult.correct ? 'words-feedback-ok' : 'words-feedback-err'
                      }`}
                      data-testid="stage4Feedback"
                    >
                      <p className="t-callout">
                        {checkResult.correct
                          ? `Верно: ${checkResult.expected}`
                          : `Нужная форма: ${checkResult.expected}`}
                      </p>
                      {checkResult.hintL1 ? (
                        <p className="t-body words-feedback-hint" data-testid="stage4HintL1">
                          {checkResult.hintL1}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="btn-outline words-audio-btn"
                        onClick={() =>
                          speakNorwegian(currentCloze.nb.replace('___', currentCloze.answer))
                        }
                      >
                        <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                        <span>Прослушать предложение</span>
                      </button>
                    </div>

                    <div className="words-grade-grid" role="group" aria-label="Оцените ответ">
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('again')}
                      >
                        Не вспомнил
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('hard')}
                      >
                        Трудно
                      </button>
                      <button
                        type="button"
                        className="btn-primary words-grade-btn"
                        onClick={() => handleGrade('good')}
                      >
                        Нормально
                      </button>
                      <button
                        type="button"
                        className="btn-outline words-grade-btn"
                        onClick={() => handleGrade('easy')}
                      >
                        Легко
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

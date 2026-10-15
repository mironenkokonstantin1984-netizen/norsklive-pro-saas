'use client';

import { useEffect, useState } from 'react';
import {
  daysUntilExam,
  logPathEvent,
  readPathPrefs,
  writeExamDate,
  writePathPrefs,
  type PathL1,
  type PathPrefs,
  type TargetCefrLevel
} from '../../lib/path/storage';
import { formatCountRu } from '../../lib/plural';
import {
  countDueToday,
  countKnownWords,
  readWordsProgress
} from '../../lib/words/progress';
import { Nora } from '../companion/Nora';
import { FirstRun, getLocalizedDatePlaceholder } from './FirstRun';
import './path.css';

export interface PathHomeProps {
  authEnabled?: boolean;
  userEmail?: string | null;
  visibleWordIds?: readonly string[];
  limitReached?: boolean;
}

const DEFAULT_VISIBLE_WORD_IDS: readonly string[] = [];

export interface ExamTopicOption {
  id: string;
  titleRu: string;
  titleUk: string;
  titleEn: string;
}

export const EXAM_TOPIC_OPTIONS: readonly ExamTopicOption[] = [
  { id: 'arbeid', titleRu: 'Работа', titleUk: 'Робота', titleEn: 'Work' },
  { id: 'helse', titleRu: 'Врач', titleUk: 'Лікар', titleEn: 'Doctor' },
  { id: 'bolig', titleRu: 'Жильё', titleUk: 'Житло', titleEn: 'Housing' },
  { id: 'familie', titleRu: 'Семья', titleUk: 'Сім’я', titleEn: 'Family' },
  { id: 'handel', titleRu: 'Магазин', titleUk: 'Магазин', titleEn: 'Shop' },
  { id: 'transport', titleRu: 'Транспорт', titleUk: 'Транспорт', titleEn: 'Transport' },
  { id: 'fritid', titleRu: 'Свободное время', titleUk: 'Вільний час', titleEn: 'Free time' }
];

export function getTopicTitle(topicId?: string, l1: PathL1 = 'ru'): string {
  const found = EXAM_TOPIC_OPTIONS.find((t) => t.id === topicId);
  if (!found) return l1 === 'uk' ? 'Робота' : l1 === 'en' ? 'Work' : 'Работа';
  if (l1 === 'uk') return found.titleUk;
  if (l1 === 'en') return found.titleEn;
  return found.titleRu;
}

export function extractLearnerFirstName(email?: string | null): string | null {
  if (!email) return null;
  const username = email.split('@')[0];
  if (!username) return null;
  const raw = username.split(/[._-]/)[0];
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function getPathTransition(targetLevel: TargetCefrLevel = 'B1'): string {
  if (targetLevel === 'A2') return 'Начальный → A2';
  if (targetLevel === 'B2') return 'B1 → B2';
  return 'A2 → B1';
}

export function PathHome({
  authEnabled = false,
  userEmail = null,
  visibleWordIds = DEFAULT_VISIBLE_WORD_IDS,
  limitReached = false
}: PathHomeProps = {}) {
  const [prefs, setPrefs] = useState<PathPrefs>(() => readPathPrefs());
  const [dueTodayWordsCount, setDueTodayWordsCount] = useState<number>(() => {
    const progress = readWordsProgress();
    return countDueToday(new Date(), visibleWordIds, progress);
  });
  const [knownWordsCount, setKnownWordsCount] = useState<number>(() => {
    const progress = readWordsProgress();
    return countKnownWords(progress, visibleWordIds);
  });

  // Modal / sheet states
  const [isFirstRunActive, setIsFirstRunActive] = useState<boolean>(false);
  const [firstRunInitialStep, setFirstRunInitialStep] = useState<1 | 2 | 3 | 4>(1);
  const [isTopicSheetOpen, setIsTopicSheetOpen] = useState<boolean>(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState<boolean>(false);
  const [dateSheetValue, setDateSheetValue] = useState<string>('');

  const wordIdsKey = visibleWordIds.join(',');

  useEffect(() => {
    const loaded = readPathPrefs();
    setPrefs(loaded);
    setDateSheetValue(loaded.examDate || '');
    const progress = readWordsProgress();
    setDueTodayWordsCount(countDueToday(new Date(), visibleWordIds, progress));
    setKnownWordsCount(countKnownWords(progress, visibleWordIds));
  }, [wordIdsKey]);

  const daysLeft = prefs.examDate ? daysUntilExam(prefs.examDate) : null;
  const userFirstName = extractLearnerFirstName(userEmail);
  const topicTitle = getTopicTitle(prefs.selectedTopic, prefs.l1);

  // Resume card handlers
  const handleResumeIntro = () => {
    setFirstRunInitialStep(3);
    setIsFirstRunActive(true);
  };

  const handleDismissIntro = () => {
    const updated = writePathPrefs({ introDismissed: true });
    setPrefs(updated);
  };

  // Topic sheet handler
  const handleSelectTopic = (topicId: string) => {
    const updated = writePathPrefs({ selectedTopic: topicId });
    setPrefs(updated);
    setIsTopicSheetOpen(false);
  };

  // Date sheet handlers
  const handleSaveExamDate = () => {
    const nextPrefs = writeExamDate(dateSheetValue || null);
    setPrefs(nextPrefs);
    setIsDateSheetOpen(false);
  };

  const handleClearExamDate = () => {
    setDateSheetValue('');
    const nextPrefs = writeExamDate(null);
    setPrefs(nextPrefs);
    setIsDateSheetOpen(false);
  };

  return (
    <main className="path-page">
      {!prefs.onboarded || isFirstRunActive ? (
        <FirstRun
          initialPrefs={prefs}
          initialStep={firstRunInitialStep}
          onSkip={(next) => {
            setPrefs(next);
            setIsFirstRunActive(false);
          }}
          onFinish={(next) => {
            setPrefs(next);
            setIsFirstRunActive(false);
          }}
        />
      ) : null}

      <div className="path-column">
        <div className="path-topbar">
          <span className="path-brand t-callout">NorskLive Pro</span>
          {(authEnabled && userEmail) || userEmail ? (
            <div className="path-auth-controls">
              <span className="path-user-email t-caption">{userEmail}</span>
              <form method="post" action="/auth/signout">
                <button type="submit" className="btn-text path-signout-btn t-callout">
                  Выйти
                </button>
              </form>
            </div>
          ) : null}
        </div>

        <header className="path-header">
          <div className="path-greeting-row">
            <Nora state="idle" size="sm" />
            <span className="path-greeting t-callout">
              {userFirstName ? `Здравствуйте, ${userFirstName}` : 'Здравствуйте'}
            </span>
          </div>
          <h1 className="path-title t-title">Сегодня: 10 минут практики</h1>
        </header>

        {/* Soft resume card if intro practice was skipped and not dismissed */}
        {prefs.onboarded && !prefs.introDone && !prefs.introDismissed ? (
          <section className="path-card path-resume-card" aria-labelledby="resumeIntroTitle">
            <div className="path-resume-content">
              <h2 id="resumeIntroTitle" className="path-card-title t-callout">
                Пройти знакомство
              </h2>
              <p className="path-card-text t-body">
                Короткая практика на 3 минуты, чтобы оценить ваш текущий уровень.
              </p>
            </div>
            <div className="path-resume-actions">
              <button
                type="button"
                className="btn-outline path-resume-start-btn t-callout"
                onClick={handleResumeIntro}
              >
                Пройти знакомство
              </button>
              <button
                type="button"
                className="btn-text path-resume-dismiss-btn t-callout"
                onClick={handleDismissIntro}
              >
                Скрыть
              </button>
            </div>
          </section>
        ) : null}

        {/* Daily limit reached notification if limitReached=true */}
        {limitReached ? (
          <section className="path-card path-limit-card" aria-labelledby="pathLimitTitle" data-testid="dailyLimitCard">
            <h2 id="pathLimitTitle" className="path-card-title t-callout">
              На сегодня бесплатные ответы закончились
            </h2>
            <p className="path-card-text t-body">
              Лимит бесплатного плана — 20 в день, завтра снова доступно.
            </p>
          </section>
        ) : null}

        {/* Block 1: Practice */}
        <section className="path-card path-card-practice" aria-labelledby="pathPracticeHeading">
          <h2 id="pathPracticeHeading" className="sr-only">
            Практика
          </h2>
          <div className="path-actions">
            <a
              href="/practice"
              className="path-primary-link t-callout"
              onClick={() => logPathEvent('practice_started')}
            >
              Начать практику
            </a>
          </div>
          <div className="path-topic-row">
            <span className="path-topic-label t-body">
              {`Тема: ${topicTitle}`}
            </span>
            <span className="path-topic-separator">·</span>
            <button
              type="button"
              className="btn-text path-topic-change-btn t-callout"
              onClick={() => setIsTopicSheetOpen(true)}
            >
              Изменить
            </button>
          </div>
        </section>

        {/* Block 2: Words */}
        <section className="path-card path-card-words" id="pathWordsCard" aria-labelledby="pathWordsHeading">
          <h2 id="pathWordsHeading" className="sr-only">
            Слова
          </h2>
          <div className="path-words-row">
            <p className="path-words-count t-body" data-testid="wordsTodayCount">
              {`Слова на сегодня: ${dueTodayWordsCount}`}
            </p>
            <span data-testid="wordsKnownCount" className="sr-only">
              {`Знаю: ${knownWordsCount}`}
            </span>
            <a href="/words" className="path-outline-link t-callout">
              Повторить
            </a>
          </div>
        </section>

        {/* Block 3: Path */}
        <section className="path-card path-card-path" aria-labelledby="pathProgressHeading">
          <div className="path-progress-header">
            <h2 id="pathProgressHeading" className="path-card-title t-callout">
              {`Мой путь: ${getPathTransition(prefs.targetLevel)}`}
            </h2>
            <div
              className="path-progress-bar-wrap"
              role="progressbar"
              aria-label="Прогресс уровня"
              aria-valuenow={40}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="path-progress-bar-fill" style={{ width: '40%' }} />
            </div>
          </div>
          {daysLeft !== null ? (
            <div className="path-exam-summary">
              <p className="path-exam-countdown t-body">
                {`До экзамена ${formatCountRu(daysLeft, { one: 'день', few: 'дня', many: 'дней' })}`}
              </p>
              <button
                type="button"
                className="btn-text path-exam-edit-btn t-callout"
                onClick={() => {
                  setDateSheetValue(prefs.examDate || '');
                  setIsDateSheetOpen(true);
                }}
              >
                Изменить дату
              </button>
            </div>
          ) : (
            <div className="path-exam-summary">
              <button
                type="button"
                className="btn-text path-exam-edit-btn t-callout"
                onClick={() => {
                  setDateSheetValue('');
                  setIsDateSheetOpen(true);
                }}
              >
                Задать дату экзамена
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Topic selection sheet */}
      {isTopicSheetOpen ? (
        <div
          className="firstrun-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topicSheetTitle"
        >
          <div className="firstrun-sheet">
            <div className="firstrun-top-row">
              <h2 id="topicSheetTitle" className="firstrun-title t-title">
                Выбор темы
              </h2>
              <button
                type="button"
                className="btn-text firstrun-skip-btn t-callout"
                onClick={() => setIsTopicSheetOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <div className="path-topic-list">
              {EXAM_TOPIC_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`path-topic-item-btn t-callout ${
                    prefs.selectedTopic === item.id ? 'is-selected' : ''
                  }`}
                  onClick={() => handleSelectTopic(item.id)}
                >
                  {getTopicTitle(item.id, prefs.l1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Date edit sheet */}
      {isDateSheetOpen ? (
        <div
          className="firstrun-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dateSheetTitle"
        >
          <div className="firstrun-sheet">
            <div className="firstrun-top-row">
              <h2 id="dateSheetTitle" className="firstrun-title t-title">
                Дата экзамена
              </h2>
              <button
                type="button"
                className="btn-text firstrun-skip-btn t-callout"
                onClick={() => setIsDateSheetOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <label className="path-exam-field t-caption" htmlFor="dateSheetInput">
              <span>{`Дата экзамена (${getLocalizedDatePlaceholder(prefs.l1)})`}</span>
              <input
                id="dateSheetInput"
                type="date"
                className="path-date-input t-body"
                value={dateSheetValue}
                onChange={(e) => setDateSheetValue(e.target.value)}
              />
            </label>
            <div className="firstrun-actions firstrun-actions-split">
              <button
                type="button"
                className="btn-text firstrun-secondary-btn t-callout"
                onClick={handleClearExamDate}
              >
                Очистить
              </button>
              <button
                type="button"
                className="btn-outline firstrun-secondary-btn t-callout"
                onClick={handleSaveExamDate}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

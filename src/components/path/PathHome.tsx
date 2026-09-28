'use client';

import { useEffect, useRef, useState } from 'react';
import {
  daysUntilExam,
  readPathPrefs,
  readSavedWordsCount,
  writeExamDate,
  type PathPrefs
} from '../../lib/path/storage';
import { nextSituation } from '../../lib/path/situations';
import { Nora } from '../companion/Nora';
import { FirstRun } from './FirstRun';
import './path.css';

export interface PathHomeProps {
  authEnabled?: boolean;
  userEmail?: string | null;
}

export function PathHome({ authEnabled = false, userEmail = null }: PathHomeProps = {}) {
  const [prefs, setPrefs] = useState<PathPrefs>(() => readPathPrefs());
  const [savedWordsCount, setSavedWordsCount] = useState<number>(() => readSavedWordsCount());
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPrefs(readPathPrefs());
    setSavedWordsCount(readSavedWordsCount());
  }, []);

  const situation = nextSituation([]);
  const daysLeft = prefs.examDate ? daysUntilExam(prefs.examDate) : null;

  const handleExamDateChange = (rawDate: string) => {
    const nextPrefs = writeExamDate(rawDate || null);
    setPrefs(nextPrefs);
  };

  const handleFocusDateInput = () => {
    dateInputRef.current?.focus();
  };

  return (
    <main className="path-page">
      {!prefs.onboarded ? (
        <FirstRun
          initialPrefs={prefs}
          onSkip={(nextPrefs) => setPrefs(nextPrefs)}
          onFinish={(nextPrefs) => setPrefs(nextPrefs)}
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
          <Nora state="idle" size="sm" />
          <h1 className="path-title t-title">{`Мой путь к ${prefs.targetLevel}`}</h1>
        </header>

        {/* Card 1: Ваш уровень сейчас */}
        <section className="path-card" aria-labelledby="pathLevelHeading">
          <h2 id="pathLevelHeading" className="path-card-title t-callout">
            Ваш уровень сейчас
          </h2>
          <p className="path-card-text t-body">
            Пройдите первую практику, и мы оценим уровень
          </p>
          <div className="path-actions">
            <a href="/studio" className="path-primary-link t-callout">
              Начать практику
            </a>
          </div>
        </section>

        {/* Card 2: Следующая ситуация */}
        <section className="path-card" aria-labelledby="pathSituationHeading">
          <h2 id="pathSituationHeading" className="path-card-title t-callout">
            Следующая ситуация
          </h2>
          <p className="path-situation-title t-speech">{situation.titleNorsk}</p>
          <p className="path-card-text t-body">{situation.descriptionRu}</p>
          <div className="path-actions">
            <a href="/studio" className="path-outline-link t-callout">
              Практиковать
            </a>
          </div>
        </section>

        {/* Card 3: Мои слова */}
        <section className="path-card" aria-labelledby="pathWordsHeading">
          <h2 id="pathWordsHeading" className="path-card-title t-callout">
            Мои слова
          </h2>
          <p className="path-words-count t-speech" data-testid="savedWordsCount">
            {`Сохранено слов: ${savedWordsCount}`}
          </p>
          <p className="path-card-text t-body">
            Слова, на которых вы споткнулись, появятся здесь
          </p>
        </section>

        {/* Card 4: Экзамен */}
        <section className="path-card" aria-labelledby="pathExamHeading">
          <h2 id="pathExamHeading" className="path-card-title t-callout">
            Экзамен
          </h2>
          <label className="path-exam-field t-caption" htmlFor="examDateInput">
            <span>Дата экзамена</span>
            <input
              ref={dateInputRef}
              id="examDateInput"
              type="date"
              className="path-date-input t-body"
              value={prefs.examDate || ''}
              onChange={(e) => handleExamDateChange(e.target.value)}
            />
          </label>
          {daysLeft !== null ? (
            <div className="path-exam-summary">
              <p className="path-exam-countdown t-body">
                {`До экзамена ${daysLeft} дней`}
              </p>
              <button
                type="button"
                className="btn-text path-exam-edit-btn t-callout"
                onClick={handleFocusDateInput}
              >
                Изменить
              </button>
            </div>
          ) : null}
        </section>

        {/* Card 5: Подписка (#plans) */}
        <section id="plans" className="path-card" aria-labelledby="pathPlansHeading">
          <h2 id="pathPlansHeading" className="path-card-title t-callout">
            Подписка
          </h2>
          <p className="path-card-text t-body">
            Месяц — 249 kr, 300 ответов в день. Оплата появится скоро.
          </p>
        </section>
      </div>
    </main>
  );
}

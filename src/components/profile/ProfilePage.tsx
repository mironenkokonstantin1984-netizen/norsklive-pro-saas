'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './profile.css';
import {
  readPathPrefs,
  writePathPrefs,
  type PathPrefs
} from '../../lib/path/storage';
import {
  loadPracticePrefs,
  savePracticePrefs,
  applyPracticePrefsToDocument,
  type PracticePrefs
} from '../../lib/prefs';
import { applyDocumentLang } from '../../lib/documentLang';
import { chooseVoice, speakNorwegian } from '../../lib/speech';
import { useNorwegianVoices } from '../../lib/useNorwegianVoices';

export interface ProfilePageProps {
  authEnabled?: boolean;
  userEmail?: string | null;
}

export function ProfilePage({
  authEnabled = false,
  userEmail = null
}: ProfilePageProps) {
  const [pathPrefs, setPathPrefs] = useState<PathPrefs>(() => readPathPrefs());
  const [practicePrefs, setPracticePrefs] = useState<PracticePrefs>(() => loadPracticePrefs());
  const voice = useNorwegianVoices();

  useEffect(() => {
    const loadedPath = readPathPrefs();
    setPathPrefs(loadedPath);
    const loadedPractice = loadPracticePrefs();
    setPracticePrefs(loadedPractice);
    applyPracticePrefsToDocument(loadedPractice);
  }, []);

  const handleUpdatePath = useCallback(
    (patch: Partial<PathPrefs>) => {
      setPathPrefs((prev) => {
        const next = { ...prev, ...patch };
        writePathPrefs(next);
        if (patch.l1) {
          applyDocumentLang(patch.l1);
        }
        return next;
      });
    },
    []
  );

  const handleUpdatePractice = useCallback(
    (patch: Partial<PracticePrefs>) => {
      setPracticePrefs((prev) => {
        const next = { ...prev, ...patch };
        savePracticePrefs(next);
        applyPracticePrefsToDocument(next);
        return next;
      });
    },
    []
  );

  const l1 = pathPrefs.l1 || 'ru';

  return (
    <div className="profile-page" data-testid="profilePage">
      <div className="profile-column">
        {/* HEADER */}
        <header className="profile-header">
          <a href="/" className="profile-back-btn" aria-label="Назад">
            ‹
          </a>
          <h1 className="profile-header-title t-title">
            {l1 === 'uk' ? 'Профіль та налаштування' : l1 === 'en' ? 'Profile & Settings' : 'Профиль и настройки'}
          </h1>
        </header>

        <main className="profile-content">
          {/* GROUP 1: Язык и уровень */}
          <section className="profile-group" aria-labelledby="langLevelGroupHeading">
            <h2 id="langLevelGroupHeading" className="profile-group-heading t-callout">
              {l1 === 'uk' ? 'Мова та рівень' : l1 === 'en' ? 'Language & Level' : 'Язык и уровень'}
            </h2>

            {/* Language of explanations */}
            <div className="profile-setting-row">
              <span className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Мова пояснень' : l1 === 'en' ? 'Explanation language' : 'Язык объяснений'}
              </span>
              <div
                className="profile-segmented-control"
                role="radiogroup"
                aria-label={l1 === 'uk' ? 'Мова пояснень' : l1 === 'en' ? 'Explanation language' : 'Язык объяснений'}
              >
                <button
                  type="button"
                  role="radio"
                  data-l1="ru"
                  aria-checked={l1 === 'ru'}
                  className={`profile-seg-btn t-callout ${l1 === 'ru' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ l1: 'ru' })}
                >
                  Русский
                </button>
                <button
                  type="button"
                  role="radio"
                  data-l1="uk"
                  aria-checked={l1 === 'uk'}
                  className={`profile-seg-btn t-callout ${l1 === 'uk' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ l1: 'uk' })}
                >
                  Українська
                </button>
                <button
                  type="button"
                  role="radio"
                  data-l1="en"
                  aria-checked={l1 === 'en'}
                  className={`profile-seg-btn t-callout ${l1 === 'en' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ l1: 'en' })}
                >
                  English
                </button>
              </div>
            </div>

            {/* Target level */}
            <div className="profile-setting-row">
              <span className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Цільовий рівень' : l1 === 'en' ? 'Target level' : 'Целевой уровень'}
              </span>
              <div
                className="profile-segmented-control"
                role="radiogroup"
                aria-label={l1 === 'uk' ? 'Цільовий рівень' : l1 === 'en' ? 'Target level' : 'Целевой уровень'}
              >
                <button
                  type="button"
                  role="radio"
                  data-level="A2"
                  aria-checked={pathPrefs.targetLevel === 'A2'}
                  className={`profile-seg-btn t-callout ${pathPrefs.targetLevel === 'A2' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ targetLevel: 'A2' })}
                >
                  A2
                </button>
                <button
                  type="button"
                  role="radio"
                  data-level="B1"
                  aria-checked={pathPrefs.targetLevel === 'B1'}
                  className={`profile-seg-btn t-callout ${pathPrefs.targetLevel === 'B1' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ targetLevel: 'B1' })}
                >
                  B1
                </button>
                <button
                  type="button"
                  role="radio"
                  data-level="B2"
                  aria-checked={pathPrefs.targetLevel === 'B2'}
                  className={`profile-seg-btn t-callout ${pathPrefs.targetLevel === 'B2' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePath({ targetLevel: 'B2' })}
                >
                  B2
                </button>
              </div>
            </div>

            {/* Exam date */}
            <div className="profile-setting-row profile-date-row">
              <label htmlFor="examDateInput" className="profile-setting-label t-body">
                {l1 === 'uk'
                  ? 'Дата іспиту (ДД.ММ.РРРР)'
                  : l1 === 'en'
                    ? 'Exam date (DD.MM.YYYY)'
                    : 'Дата экзамена (ДД.ММ.ГГГГ)'}
              </label>
              <div className="profile-date-input-wrap">
                <input
                  type="date"
                  id="examDateInput"
                  className="profile-date-input t-body"
                  value={pathPrefs.examDate || ''}
                  onChange={(e) => handleUpdatePath({ examDate: e.target.value })}
                />
                {pathPrefs.examDate ? (
                  <button
                    type="button"
                    className="btn-text profile-clear-date-btn t-caption"
                    onClick={() => handleUpdatePath({ examDate: '' })}
                  >
                    {l1 === 'uk' ? 'Очистити' : l1 === 'en' ? 'Clear' : 'Очистить'}
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {/* GROUP 2: Практика */}
          <section className="profile-group" aria-labelledby="practiceGroupHeading">
            <h2 id="practiceGroupHeading" className="profile-group-heading t-callout">
              {l1 === 'uk' ? 'Практика' : l1 === 'en' ? 'Practice' : 'Практика'}
            </h2>

            <div className="profile-setting-row profile-switch-row">
              <span id="autoSendSwitchLabel" className="profile-setting-label t-body">
                {l1 === 'uk'
                  ? 'Відправляти одразу після «Готово»'
                  : l1 === 'en'
                    ? 'Send right after "Done"'
                    : 'Отправлять сразу после «Готово»'}
              </span>
              <button
                type="button"
                role="switch"
                id="autoSendSwitch"
                aria-labelledby="autoSendSwitchLabel"
                aria-checked={practicePrefs.autoSend}
                className={`profile-switch ${practicePrefs.autoSend ? 'is-on' : ''}`}
                onClick={() => handleUpdatePractice({ autoSend: !practicePrefs.autoSend })}
              >
                <span className="profile-switch-track" aria-hidden="true">
                  <span className="profile-switch-thumb" />
                </span>
                <span className="t-caption">
                  {practicePrefs.autoSend
                    ? l1 === 'uk' ? 'Увімк' : l1 === 'en' ? 'On' : 'Вкл'
                    : l1 === 'uk' ? 'Вимк' : l1 === 'en' ? 'Off' : 'Выкл'}
                </span>
              </button>
            </div>
          </section>

          {/* GROUP 3: Голос */}
          <section className="profile-group" aria-labelledby="voiceGroupHeading">
            <h2 id="voiceGroupHeading" className="profile-group-heading t-callout">
              {l1 === 'uk' ? 'Голос' : l1 === 'en' ? 'Voice' : 'Голос'}
            </h2>

            {/* Voice row */}
            <div className="profile-setting-row" id="voiceRow">
              <span className="profile-setting-label t-body" id="voiceLabel">
                {l1 === 'uk' ? 'Голос екзаменатора' : l1 === 'en' ? 'Examiner voice' : 'Голос экзаменатора'}
              </span>

              {voice.status === 'none' ? (
                <p className="t-caption">
                  {l1 === 'uk'
                    ? 'Норвезький голос не знайдено на цьому пристрої.'
                    : l1 === 'en'
                      ? 'No Norwegian voice found on this device.'
                      : 'Норвежский голос не найден на этом устройстве.'}
                </p>
              ) : voice.status === 'loading' ? (
                <p className="t-caption">
                  {l1 === 'uk' ? 'Шукаємо голоси…' : l1 === 'en' ? 'Searching voices…' : 'Ищем голоса…'}
                </p>
              ) : (
                <div className="profile-voice-controls">
                  <p className="t-caption" id="voiceCurrent">
                    {voice.selectedName}
                  </p>
                  {voice.voices.length > 1 ? (
                    <div className="profile-voice-options" role="radiogroup" aria-labelledby="voiceLabel">
                      {voice.voices.map((v) => (
                        <button
                          key={v.name}
                          type="button"
                          role="radio"
                          aria-checked={v.name === voice.selectedName}
                          className={`profile-seg-btn t-callout ${v.name === voice.selectedName ? 'is-active' : ''}`}
                          onClick={() => chooseVoice(v.name)}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    id="voiceTestBtn"
                    className="btn-outline profile-voice-test-btn t-callout"
                    onClick={() =>
                      void speakNorwegian('Hei, jeg heter Nora. Hvordan har du det i dag?', {
                        rate: practicePrefs.tempo
                      })
                    }
                  >
                    {l1 === 'uk' ? 'Перевірити голос' : l1 === 'en' ? 'Test voice' : 'Проверить голос'}
                  </button>
                </div>
              )}
            </div>

            {/* Tempo 0.8 / 1.0 */}
            <div className="profile-setting-row">
              <span className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Темп мови екзаменатора' : l1 === 'en' ? 'Examiner speech tempo' : 'Темп речи экзаменатора'}
              </span>
              <div
                className="profile-segmented-control"
                role="radiogroup"
                aria-label={l1 === 'uk' ? 'Темп мови екзаменатора' : l1 === 'en' ? 'Examiner speech tempo' : 'Темп речи экзаменатора'}
              >
                <button
                  type="button"
                  role="radio"
                  data-tempo="0.8"
                  aria-checked={practicePrefs.tempo === 0.8}
                  className={`profile-seg-btn t-callout ${practicePrefs.tempo === 0.8 ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ tempo: 0.8 })}
                >
                  0.8
                </button>
                <button
                  type="button"
                  role="radio"
                  data-tempo="1.0"
                  aria-checked={practicePrefs.tempo === 1.0}
                  className={`profile-seg-btn t-callout ${practicePrefs.tempo === 1.0 ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ tempo: 1.0 })}
                >
                  1.0
                </button>
              </div>
            </div>

            {/* Examiner subtitles */}
            <div className="profile-setting-row profile-switch-row">
              <span id="subtitlesSwitchLabel" className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Субтитри екзаменатора' : l1 === 'en' ? 'Examiner subtitles' : 'Субтитры экзаменатора'}
              </span>
              <button
                type="button"
                role="switch"
                id="subtitlesSwitch"
                aria-labelledby="subtitlesSwitchLabel"
                aria-checked={practicePrefs.subtitles}
                className={`profile-switch ${practicePrefs.subtitles ? 'is-on' : ''}`}
                onClick={() => handleUpdatePractice({ subtitles: !practicePrefs.subtitles })}
              >
                <span className="profile-switch-track" aria-hidden="true">
                  <span className="profile-switch-thumb" />
                </span>
                <span className="t-caption">
                  {practicePrefs.subtitles
                    ? l1 === 'uk' ? 'Увімк' : l1 === 'en' ? 'On' : 'Вкл'
                    : l1 === 'uk' ? 'Вимк' : l1 === 'en' ? 'Off' : 'Выкл'}
                </span>
              </button>
            </div>
          </section>

          {/* GROUP 4: Вид */}
          <section className="profile-group" aria-labelledby="viewGroupHeading">
            <h2 id="viewGroupHeading" className="profile-group-heading t-callout">
              {l1 === 'uk' ? 'Вигляд' : l1 === 'en' ? 'Appearance' : 'Вид'}
            </h2>

            {/* Text size (3 steps) */}
            <div className="profile-setting-row">
              <span className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Розмір тексту' : l1 === 'en' ? 'Text size' : 'Размер текста'}
              </span>
              <div
                className="profile-segmented-control"
                role="radiogroup"
                aria-label={l1 === 'uk' ? 'Розмір тексту' : l1 === 'en' ? 'Text size' : 'Размер текста'}
              >
                <button
                  type="button"
                  role="radio"
                  data-size="sm"
                  aria-checked={practicePrefs.textSize === 'sm'}
                  className={`profile-seg-btn t-callout ${practicePrefs.textSize === 'sm' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ textSize: 'sm' })}
                >
                  {l1 === 'uk' ? 'Стандартний' : l1 === 'en' ? 'Standard' : 'Стандартный'}
                </button>
                <button
                  type="button"
                  role="radio"
                  data-size="md"
                  aria-checked={practicePrefs.textSize === 'md'}
                  className={`profile-seg-btn t-callout ${practicePrefs.textSize === 'md' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ textSize: 'md' })}
                >
                  {l1 === 'uk' ? 'Великий' : l1 === 'en' ? 'Large' : 'Крупный'}
                </button>
                <button
                  type="button"
                  role="radio"
                  data-size="lg"
                  aria-checked={practicePrefs.textSize === 'lg'}
                  className={`profile-seg-btn t-callout ${practicePrefs.textSize === 'lg' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ textSize: 'lg' })}
                >
                  {l1 === 'uk' ? 'Дуже великий' : l1 === 'en' ? 'Extra large' : 'Очень крупный'}
                </button>
              </div>
            </div>

            {/* Increased contrast */}
            <div className="profile-setting-row profile-switch-row">
              <span id="contrastSwitchLabel" className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Підвищений контраст' : l1 === 'en' ? 'High contrast' : 'Повышенный контраст'}
              </span>
              <button
                type="button"
                role="switch"
                id="contrastSwitch"
                aria-labelledby="contrastSwitchLabel"
                aria-checked={practicePrefs.contrast}
                className={`profile-switch ${practicePrefs.contrast ? 'is-on' : ''}`}
                onClick={() => handleUpdatePractice({ contrast: !practicePrefs.contrast })}
              >
                <span className="profile-switch-track" aria-hidden="true">
                  <span className="profile-switch-thumb" />
                </span>
                <span className="t-caption">
                  {practicePrefs.contrast
                    ? l1 === 'uk' ? 'Увімк' : l1 === 'en' ? 'On' : 'Вкл'
                    : l1 === 'uk' ? 'Вимк' : l1 === 'en' ? 'Off' : 'Выкл'}
                </span>
              </button>
            </div>

            {/* Theme (light, dark, system) */}
            <div className="profile-setting-row">
              <span className="profile-setting-label t-body">
                {l1 === 'uk' ? 'Тема оформлення' : l1 === 'en' ? 'Theme' : 'Тема оформления'}
              </span>
              <div
                className="profile-segmented-control"
                role="radiogroup"
                aria-label={l1 === 'uk' ? 'Тема оформлення' : l1 === 'en' ? 'Theme' : 'Тема оформления'}
              >
                <button
                  type="button"
                  role="radio"
                  data-theme="light"
                  aria-checked={practicePrefs.theme === 'light'}
                  className={`profile-seg-btn t-callout ${practicePrefs.theme === 'light' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ theme: 'light' })}
                >
                  {l1 === 'uk' ? 'Світла' : l1 === 'en' ? 'Light' : 'Светлая'}
                </button>
                <button
                  type="button"
                  role="radio"
                  data-theme="dark"
                  aria-checked={practicePrefs.theme === 'dark'}
                  className={`profile-seg-btn t-callout ${practicePrefs.theme === 'dark' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ theme: 'dark' })}
                >
                  {l1 === 'uk' ? 'Темна' : l1 === 'en' ? 'Dark' : 'Тёмная'}
                </button>
                <button
                  type="button"
                  role="radio"
                  data-theme="system"
                  aria-checked={!practicePrefs.theme || practicePrefs.theme === 'system'}
                  className={`profile-seg-btn t-callout ${!practicePrefs.theme || practicePrefs.theme === 'system' ? 'is-active' : ''}`}
                  onClick={() => handleUpdatePractice({ theme: 'system' })}
                >
                  {l1 === 'uk' ? 'Системна' : l1 === 'en' ? 'System' : 'Системная'}
                </button>
              </div>
            </div>
          </section>

          {/* GROUP 5: Аккаунт */}
          <section className="profile-group" aria-labelledby="accountGroupHeading">
            <h2 id="accountGroupHeading" className="profile-group-heading t-callout">
              {l1 === 'uk' ? 'Акаунт' : l1 === 'en' ? 'Account' : 'Аккаунт'}
            </h2>

            <div className="profile-setting-row profile-account-row">
              <div className="profile-account-info">
                <span className="profile-setting-label t-body">
                  {l1 === 'uk' ? 'Електронна пошта' : l1 === 'en' ? 'Email' : 'Электронная почта'}
                </span>
                <span className="profile-account-value t-caption">
                  {authEnabled && userEmail
                    ? userEmail
                    : authEnabled
                      ? l1 === 'uk' ? 'Не ввійшли' : l1 === 'en' ? 'Not signed in' : 'Не выполнен вход'
                      : l1 === 'uk' ? 'Гостьовий режим' : l1 === 'en' ? 'Guest mode' : 'Гостевой режим'}
                </span>
              </div>

              {authEnabled ? (
                userEmail ? (
                  <form method="post" action="/auth/signout">
                    <button type="submit" className="btn-outline profile-action-btn t-callout">
                      {l1 === 'uk' ? 'Вийти' : l1 === 'en' ? 'Sign out' : 'Выйти'}
                    </button>
                  </form>
                ) : (
                  <a href="/login" className="btn-outline profile-action-btn t-callout">
                    {l1 === 'uk' ? 'Увійти' : l1 === 'en' ? 'Sign in' : 'Войти'}
                  </a>
                )
              ) : null}
            </div>

            <div className="profile-setting-row">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="btn-text profile-delete-btn t-callout"
              >
                {l1 === 'uk'
                  ? 'Видалити акаунт (Скоро)'
                  : l1 === 'en'
                    ? 'Delete account (Soon)'
                    : 'Удалить аккаунт (Скоро)'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

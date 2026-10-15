'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Nora } from '../companion/Nora';
import {
  logPathEvent,
  writePathPrefs,
  type PathL1,
  type PathPrefs,
  type TargetCefrLevel
} from '../../lib/path/storage';
import { speakNorwegian } from '../../lib/speech';
import { applyDocumentLang } from '../../lib/documentLang';

export interface FirstRunProps {
  initialPrefs: PathPrefs;
  initialStep?: 1 | 2 | 3 | 4;
  onSkip: (prefs: PathPrefs) => void;
  onFinish: (prefs: PathPrefs) => void;
}

interface QuestionDef {
  norsk: string;
  translations: Record<PathL1, string>;
  praise: Record<PathL1, string>;
}

const INTRO_QUESTIONS: QuestionDef[] = [
  {
    norsk: 'Hva heter du?',
    translations: {
      ru: 'Как вас зовут?',
      uk: 'Як вас звати?',
      en: 'What is your name?'
    },
    praise: {
      ru: 'Вы правильно назвали имя. Отличное начало!',
      uk: 'Ви правильно назвали ім’я. Чудовий початок!',
      en: 'You correctly stated your name. Great start!'
    }
  },
  {
    norsk: 'Hvor kommer du fra?',
    translations: {
      ru: 'Откуда вы?',
      uk: 'Звідки ви?',
      en: 'Where are you from?'
    },
    praise: {
      ru: 'Правильный порядок слов и предлог fra.',
      uk: 'Правильний порядок слів і прийменник fra.',
      en: 'Correct word order and preposition fra.'
    }
  },
  {
    norsk: 'Hva jobber du med?',
    translations: {
      ru: 'Кем вы работаете?',
      uk: 'Ким ви працюєте?',
      en: 'What do you do for work?'
    },
    praise: {
      ru: 'Прекрасно! Все три ответа получены.',
      uk: 'Прекрасно! Усі три відповіді отримано.',
      en: 'Wonderful! All three answers completed.'
    }
  }
];

export function getLocalizedDatePlaceholder(l1: PathL1 = 'ru'): string {
  if (l1 === 'uk') return 'ДД.ММ.РРРР';
  if (l1 === 'en') return 'DD.MM.YYYY';
  return 'ДД.ММ.ГГГГ';
}

export function FirstRun({
  initialPrefs,
  initialStep = 1,
  onSkip,
  onFinish
}: FirstRunProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [l1, setL1] = useState<PathL1>(initialPrefs.l1 ?? 'ru');
  const [targetLevel, setTargetLevel] = useState<TargetCefrLevel>(
    initialPrefs.targetLevel ?? 'B1'
  );
  const [examDate, setExamDate] = useState<string>(initialPrefs.examDate ?? '');

  // Step 3 intro practice state
  const [qIndex, setQIndex] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logPathEvent('firstrun_step_shown', step);
  }, [step]);

  const handleSkip = () => {
    logPathEvent('firstrun_skipped');
    const updated = writePathPrefs({
      onboarded: true,
      targetLevel,
      l1,
      introDone: false,
      examDate: examDate || undefined
    });
    onSkip(updated);
  };

  const handleFinish = () => {
    logPathEvent('firstrun_step_done', 4);
    const updated = writePathPrefs({
      onboarded: true,
      introDone: true,
      targetLevel,
      l1,
      examDate: examDate || undefined
    });
    onFinish(updated);
  };

  // Step 1: language choice
  const handleSelectL1 = (nextL1: PathL1) => {
    setL1(nextL1);
    applyDocumentLang(nextL1);
    writePathPrefs({ l1: nextL1 });
  };

  const handleStep1Next = () => {
    logPathEvent('firstrun_step_done', 1);
    setStep(2);
  };

  // Step 2: level & date
  const handleSelectLevel = (level: TargetCefrLevel) => {
    setTargetLevel(level);
    writePathPrefs({ targetLevel: level });
  };

  const handleDateUnknown = () => {
    setExamDate('');
    writePathPrefs({ examDate: undefined, targetLevel });
    logPathEvent('firstrun_step_done', 2);
    setStep(3);
  };

  const handleStep2Next = () => {
    writePathPrefs({
      targetLevel,
      examDate: examDate || undefined
    });
    logPathEvent('firstrun_step_done', 2);
    setStep(3);
  };

  // Step 3: intro mini-practice
  const handleSpeakQuestion = () => {
    const currentQ = INTRO_QUESTIONS[qIndex]?.norsk;
    if (!currentQ) return;
    setIsSpeaking(true);
    speakNorwegian(currentQ, {
      onEnd: () => setIsSpeaking(false)
    }).catch(() => {
      setIsSpeaking(false);
    });
  };

  const handleSubmitAnswer = () => {
    const trimmed = answerInput.trim();
    if (!trimmed) return;
    setSubmittedAnswer(trimmed);
  };

  const handleNextQuestion = () => {
    if (qIndex < INTRO_QUESTIONS.length - 1) {
      setQIndex((prev) => prev + 1);
      setAnswerInput('');
      setSubmittedAnswer(null);
    } else {
      logPathEvent('intro_practice_done');
      logPathEvent('firstrun_step_done', 3);
      setStep(4);
    }
  };

  // Accessibility & focus management
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const stepTarget = el.querySelector<HTMLElement>(
      '.firstrun-step input:not([disabled]), .firstrun-step button.is-selected:not([disabled]), .firstrun-step button:not([disabled])'
    );
    if (stepTarget) {
      stepTarget.focus();
      return;
    }
    const focusables = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    focusables[0]?.focus();
  }, [step, qIndex, submittedAnswer]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleSkip();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const currentQ = INTRO_QUESTIONS[qIndex];

  return (
    <div
      className="firstrun-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firstRunQuestionTitle"
      onKeyDown={handleKeyDown}
    >
      <div className="firstrun-sheet" ref={dialogRef}>
        <div className="firstrun-top-row">
          <span className="firstrun-progress t-caption">
            {step <= 3 ? `${step} из 3` : '3 из 3'}
          </span>
          <button
            type="button"
            className="btn-text firstrun-skip-btn t-callout"
            onClick={handleSkip}
          >
            Пропустить
          </button>
        </div>

        {/* Step 1: Language of explanations */}
        {step === 1 ? (
          <div className="firstrun-step">
            <div className="firstrun-nora firstrun-nora-step1">
              <Nora state="idle" size="md" />
              <p className="firstrun-greeting t-body">
                {l1 === 'uk'
                  ? 'Привіт, я Нора. Три коротких запитання, і почнемо.'
                  : l1 === 'en'
                    ? "Hi, I'm Nora. Three quick questions, and we'll begin."
                    : 'Привет, я Нора. Три коротких вопроса, и начнём.'}
              </p>
            </div>

            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              {l1 === 'uk'
                ? 'Якою мовою пояснювати?'
                : l1 === 'en'
                  ? 'Which language for explanations?'
                  : 'На каком языке объяснять?'}
            </h2>

            <div className="firstrun-segmented" role="group" aria-label="Язык объяснений">
              {(
                [
                  { code: 'ru', label: 'Русский' },
                  { code: 'uk', label: 'Українська' },
                  { code: 'en', label: 'English' }
                ] as const
              ).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`firstrun-segment-btn t-callout ${
                    l1 === item.code ? 'is-selected' : ''
                  }`}
                  aria-pressed={l1 === item.code}
                  onClick={() => handleSelectL1(item.code)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="firstrun-actions">
              <button
                type="button"
                className="btn-primary firstrun-primary-btn t-callout"
                onClick={handleStep1Next}
              >
                {l1 === 'uk' ? 'Далі' : l1 === 'en' ? 'Next' : 'Дальше'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 2: Target level & exam date */}
        {step === 2 ? (
          <div className="firstrun-step">
            <div className="firstrun-nora">
              <Nora state="idle" size="sm" />
            </div>

            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              {l1 === 'uk'
                ? 'Ціль та дата іспиту'
                : l1 === 'en'
                  ? 'Target level and exam date'
                  : 'Цель и дата экзамена'}
            </h2>

            <div className="firstrun-field-group">
              <span className="firstrun-field-label t-caption">
                {l1 === 'uk'
                  ? 'Який рівень потрібен?'
                  : l1 === 'en'
                    ? 'What level do you need?'
                    : 'Какой уровень нужен?'}
              </span>
              <div className="firstrun-segmented" role="group" aria-label="Целевой уровень">
                {(['A2', 'B1', 'B2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`firstrun-segment-btn t-callout ${
                      targetLevel === lvl ? 'is-selected' : ''
                    }`}
                    aria-pressed={targetLevel === lvl}
                    onClick={() => handleSelectLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <label className="path-exam-field t-caption" htmlFor="firstRunExamDate">
              <span>{`Дата экзамена (${getLocalizedDatePlaceholder(l1)})`}</span>
              <input
                id="firstRunExamDate"
                type="date"
                className="path-date-input t-body"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </label>

            <div className="firstrun-actions firstrun-actions-split">
              <button
                type="button"
                className="btn-text firstrun-secondary-btn t-callout"
                onClick={handleDateUnknown}
              >
                {l1 === 'uk' ? 'Поки не знаю' : l1 === 'en' ? 'Not sure yet' : 'Пока не знаю'}
              </button>
              <button
                type="button"
                className="btn-primary firstrun-primary-btn t-callout"
                onClick={handleStep2Next}
              >
                {l1 === 'uk' ? 'Далі' : l1 === 'en' ? 'Next' : 'Дальше'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 3: Mini-practice «Знакомство» */}
        {step === 3 ? (
          <div className="firstrun-step">
            <div className="firstrun-nora">
              <Nora state={isSpeaking ? 'speaking' : 'idle'} size="sm" />
            </div>

            <div className="firstrun-step-header">
              <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
                {l1 === 'uk' ? 'Знайомство' : l1 === 'en' ? 'Welcome' : 'Знакомство'}
              </h2>
              <span className="firstrun-question-counter t-caption">
                {`Вопрос ${qIndex + 1} из ${INTRO_QUESTIONS.length}`}
              </span>
            </div>

            <div className="firstrun-speech-card">
              <p className="firstrun-question-norsk t-speech">«{currentQ.norsk}»</p>
              <p className="firstrun-question-translation t-caption">
                {currentQ.translations[l1]}
              </p>
              <button
                type="button"
                className="btn-text firstrun-listen-btn t-callout"
                onClick={handleSpeakQuestion}
              >
                Слушать
              </button>
            </div>

            {submittedAnswer === null ? (
              <div className="firstrun-answer-block">
                <label className="sr-only" htmlFor="firstRunAnswerInput">
                  Ваш ответ
                </label>
                <input
                  id="firstRunAnswerInput"
                  type="text"
                  className="firstrun-answer-input t-body"
                  placeholder={
                    qIndex === 0
                      ? 'Jeg heter ...'
                      : qIndex === 1
                        ? 'Jeg kommer fra ...'
                        : 'Jeg jobber som ...'
                  }
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-primary firstrun-primary-btn t-callout"
                  disabled={!answerInput.trim()}
                  onClick={handleSubmitAnswer}
                >
                  Ответить
                </button>
              </div>
            ) : (
              <div className="firstrun-feedback-card" data-testid="introFeedbackCard">
                <div className="firstrun-feedback-badge t-callout">Хорошо!</div>
                <p className="firstrun-feedback-text t-body">
                  {currentQ.praise[l1]}
                </p>
                <div className="firstrun-actions">
                  <button
                    type="button"
                    className="btn-primary firstrun-primary-btn t-callout"
                    onClick={handleNextQuestion}
                  >
                    Дальше
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Step 4: Summary screen */}
        {step === 4 ? (
          <div className="firstrun-step">
            <div className="firstrun-nora">
              <Nora state="idle" size="md" />
            </div>

            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              Отличное начало!
            </h2>

            <p className="firstrun-summary-subtitle t-body">
              Вы сказали три фразы
            </p>

            <ul className="firstrun-summary-list t-body">
              <li className="firstrun-summary-item">Правильный порядок слов (V2)</li>
              <li className="firstrun-summary-item">Понятная речь без долгих пауз</li>
              <li className="firstrun-summary-item">Базовые фразы для экзамена освоены</li>
            </ul>

            <div className="firstrun-actions">
              <button
                type="button"
                className="btn-primary firstrun-primary-btn t-callout"
                onClick={handleFinish}
              >
                Перейти на главную
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

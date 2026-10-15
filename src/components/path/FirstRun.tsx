'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Mic, Square, CheckCircle2 } from 'lucide-react';
import { Nora } from '../companion/Nora';
import { FeedbackCard } from '../practice/FeedbackCard';
import {
  useSpeechRecognition,
  MIC_RECORDING_HINT
} from '../../lib/useSpeechRecognition';
import { postCoach } from '../../lib/coachClient';
import {
  filterFeedbackErrorsByLearnerText,
  type CoachFeedback
} from '../../server/schemas';
import {
  logPathEvent,
  writePathPrefs,
  type PathL1,
  type PathPrefs,
  type TargetCefrLevel
} from '../../lib/path/storage';
import { speakNorwegian } from '../../lib/speech';
import { applyDocumentLang } from '../../lib/documentLang';
import '../practice/practice.css';

export interface FirstRunProps {
  initialPrefs: PathPrefs;
  initialStep?: 1 | 2 | 3 | 4;
  onSkip: (prefs: PathPrefs) => void;
  onFinish: (prefs: PathPrefs) => void;
}

interface QuestionDef {
  norsk: string;
  translations: Record<PathL1, string>;
}

const INTRO_QUESTIONS: QuestionDef[] = [
  {
    norsk: 'Hva heter du?',
    translations: {
      ru: 'Как вас зовут?',
      uk: 'Як вас звати?',
      en: 'What is your name?'
    }
  },
  {
    norsk: 'Hvor kommer du fra?',
    translations: {
      ru: 'Откуда вы?',
      uk: 'Звідки ви?',
      en: 'Where are you from?'
    }
  },
  {
    norsk: 'Hva jobber du med?',
    translations: {
      ru: 'Кем вы работаете?',
      uk: 'Ким ви працюєте?',
      en: 'What do you do for work?'
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
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micStatusText, setMicStatusText] = useState<string>('');
  const [liveText, setLiveText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | null>(null);
  const [coachDown, setCoachDown] = useState<boolean>(false);
  const [answersResult, setAnswersResult] = useState<
    Array<{ status: 'ok' | 'has_errors' | 'unavailable'; text: string }>
  >([]);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    );
    setIsSpeechSupported(supported);
    if (!supported) {
      setShowTextInput(true);
    }
  }, []);

  const onTranscriptChange = useCallback((text: string) => {
    setAnswerInput(text);
    if (text) {
      setShowTextInput(true);
    }
  }, []);

  const { toggleMic } = useSpeechRecognition({
    inputText: answerInput,
    onTranscriptChange,
    onSubmitTranscript: () => {},
    onRecordingChange: (rec) => setIsRecording(rec),
    onSpeakingChange: () => {},
    onStatusChange: (status) => setMicStatusText(status),
    onLiveTextChange: (txt) => setLiveText(txt),
    onUnsupported: () => setShowTextInput(true),
    autoSend: false
  });

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

  const handleSubmitAnswer = async () => {
    const trimmed = answerInput.trim();
    if (!trimmed || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await postCoach({
        module: 'norskprove',
        scenarioId: 'standard',
        level: 'A2',
        l1: l1 === 'uk' ? 'ua' : l1,
        persona: 'standard',
        userText: trimmed,
        history: [],
        usedWords: []
      });
      const filtered = filterFeedbackErrorsByLearnerText(res.feedback, trimmed);
      setCoachFeedback(filtered);
      setCoachDown(false);
      setSubmittedAnswer(trimmed);
      setAnswersResult((prev) => [...prev, { status: filtered.status, text: trimmed }]);
    } catch {
      setCoachFeedback(null);
      setCoachDown(true);
      setSubmittedAnswer(trimmed);
      setAnswersResult((prev) => [...prev, { status: 'unavailable', text: trimmed }]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (qIndex < INTRO_QUESTIONS.length - 1) {
      setQIndex((prev) => prev + 1);
      setAnswerInput('');
      setSubmittedAnswer(null);
      setCoachFeedback(null);
      setCoachDown(false);
      setLiveText('');
      setMicStatusText('');
      if (isSpeechSupported) {
        setShowTextInput(false);
      }
    } else {
      logPathEvent('intro_practice_done');
      logPathEvent('firstrun_step_done', 3);
      setStep(4);
    }
  };

  const handleRepeatAnswer = () => {
    setSubmittedAnswer(null);
    setCoachFeedback(null);
    setCoachDown(false);
    setShowTextInput(true);
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
  }, [step, qIndex, submittedAnswer, showTextInput]);

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
              <Nora
                state={
                  isSpeaking
                    ? 'speaking'
                    : isEvaluating
                      ? 'thinking'
                      : isRecording
                        ? 'listening'
                        : 'idle'
                }
                size="sm"
              />
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
              <div className="firstrun-answer-section">
                {/* Speech recognition mic dock */}
                {isSpeechSupported && (
                  <div className="firstrun-voice-dock">
                    <button
                      type="button"
                      className={`practice-mic-button ${isRecording ? 'is-recording' : ''}`}
                      onClick={toggleMic}
                      disabled={isEvaluating}
                      aria-label={isRecording ? 'Готово' : 'Говорить'}
                      aria-pressed={isRecording}
                    >
                      {isRecording ? (
                        <Square size={24} aria-hidden="true" />
                      ) : (
                        <Mic size={24} aria-hidden="true" />
                      )}
                    </button>
                    <span className="firstrun-mic-label t-callout">
                      {isRecording ? 'Готово' : 'Говорить'}
                    </span>
                    {(isRecording ? MIC_RECORDING_HINT : micStatusText) ? (
                      <span className="firstrun-mic-status t-caption">
                        {isRecording ? MIC_RECORDING_HINT : micStatusText}
                      </span>
                    ) : null}
                    {liveText ? (
                      <p className="firstrun-mic-live t-body" lang="nb">
                        {liveText}
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Alternative: Text input */}
                {!isSpeechSupported || showTextInput ? (
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
                          void handleSubmitAnswer();
                        }
                      }}
                      disabled={isEvaluating}
                    />
                    <button
                      type="button"
                      className="btn-primary firstrun-primary-btn t-callout"
                      disabled={!answerInput.trim() || isEvaluating}
                      onClick={() => void handleSubmitAnswer()}
                    >
                      {isEvaluating ? 'Проверяем...' : 'Ответить'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-text firstrun-text-toggle-btn t-callout"
                    onClick={() => setShowTextInput(true)}
                  >
                    Написать ответ
                  </button>
                )}
              </div>
            ) : coachDown ? (
              <div
                className="practice-feedback-card firstrun-feedback-calm"
                data-testid="introFeedbackCard"
                role="region"
                aria-label="Разбор ответа"
              >
                <div className="practice-feedback-header">
                  <CheckCircle2
                    size={22}
                    className="practice-feedback-icon-ok"
                    aria-hidden="true"
                  />
                  <span className="practice-feedback-title t-callout">
                    {l1 === 'uk'
                      ? 'Відповідь прийнято'
                      : l1 === 'en'
                        ? 'Answer accepted'
                        : 'Ответ принят'}
                  </span>
                </div>
                <p className="practice-feedback-praise t-body">
                  {l1 === 'uk'
                    ? 'Відповідь прийнято. Розбір покажемо, коли сервіс перевірки буде доступний.'
                    : l1 === 'en'
                      ? 'Answer accepted. Feedback will be shown when the checking service is available.'
                      : 'Ответ принят. Разбор покажем, когда сервис проверки будет доступен.'}
                </p>
                <div className="practice-feedback-actions">
                  <button
                    type="button"
                    className="practice-filled-btn t-callout"
                    onClick={handleNextQuestion}
                    aria-label="Дальше"
                  >
                    Дальше
                  </button>
                </div>
              </div>
            ) : coachFeedback ? (
              <div className="firstrun-feedback-wrapper" data-testid="introFeedbackCard">
                <FeedbackCard
                  feedback={coachFeedback}
                  learnerText={submittedAnswer}
                  onNext={handleNextQuestion}
                  onRepeat={handleRepeatAnswer}
                  onSpeak={(text) => {
                    void speakNorwegian(text);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 4: Summary screen */}
        {step === 4 ? (
          <div className="firstrun-step">
            <div className="firstrun-nora">
              <Nora state="idle" size="md" />
            </div>

            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              {l1 === 'uk' ? 'Чудовий початок!' : l1 === 'en' ? 'Great start!' : 'Отличное начало!'}
            </h2>

            <p className="firstrun-summary-subtitle t-body">
              {l1 === 'uk'
                ? 'Ви сказали три фрази'
                : l1 === 'en'
                  ? 'You spoke three phrases'
                  : 'Вы сказали три фразы'}
            </p>

            <ul className="firstrun-summary-list t-body">
              {answersResult.filter((a) => a.status === 'ok').length === 3 && (
                <li className="firstrun-summary-item">
                  {l1 === 'uk'
                    ? 'Усі 3 відповіді прийнято без зауважень'
                    : l1 === 'en'
                      ? 'All 3 answers accepted without errors'
                      : 'Все 3 ответа приняты без замечаний'}
                </li>
              )}
              {answersResult.filter((a) => a.status === 'ok').length > 0 &&
                answersResult.filter((a) => a.status === 'ok').length < 3 && (
                  <li className="firstrun-summary-item">
                    {l1 === 'uk'
                      ? `${answersResult.filter((a) => a.status === 'ok').length} із 3 відповідей прийнято без зауважень`
                      : l1 === 'en'
                        ? `${answersResult.filter((a) => a.status === 'ok').length} of 3 answers accepted without remarks`
                        : `${answersResult.filter((a) => a.status === 'ok').length} из 3 ответов приняты без замечаний`}
                  </li>
                )}
              {answersResult.some((a) => a.status === 'has_errors') && (
                <li className="firstrun-summary-item">
                  {l1 === 'uk'
                    ? 'Помилки розібрано, ви готові до практики'
                    : l1 === 'en'
                      ? 'Errors reviewed, ready for practice'
                      : 'Ошибки разобраны, вы готовы к практике'}
                </li>
              )}
              {answersResult.some((a) => a.status === 'unavailable') && (
                <li className="firstrun-summary-item">
                  {l1 === 'uk'
                    ? 'Відповіді збережено для перевірки'
                    : l1 === 'en'
                      ? 'Answers saved for review'
                      : 'Ответы сохранены для проверки'}
                </li>
              )}
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

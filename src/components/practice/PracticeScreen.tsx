'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import './practice.css';
import {
  useStudioState
} from '../studio/useStudioState';
import type { CoachFeedback, Correction } from '../../server/schemas';
import {
  useSpeechRecognition,
  MIC_MESSAGES,
  MIC_RECORDING_HINT
} from '../../lib/useSpeechRecognition';
import {
  DEFAULT_PRACTICE_PREFS,
  loadPracticePrefs,
  applyPracticePrefsToDocument,
  type PracticePrefs
} from '../../lib/prefs';
import { applyDocumentLang } from '../../lib/documentLang';
import { VoiceNotice } from '../studio/VoiceNotice';
import { CorrectionCard } from '../studio/CorrectionCard';
import { ScenarioIllustration } from '../../content/scenarios/images';

export const COACH_UNAVAILABLE_MESSAGE =
  'Сервис проверки сейчас недоступен. Попробуйте повторить через минуту.';

export const NO_SPEECH_SUPPORT_MESSAGE =
  'Распознавание речи не поддерживается в этом браузере. Вы можете отвечать текстом.';

export const NO_MIC_PERMISSION_MESSAGE =
  'Доступ к микрофону заблокирован. Разрешите его в настройках браузера.';

export const EMPTY_HISTORY_MESSAGE = 'История диалога пуста.';

export interface PracticeScreenProps {
  authEnabled?: boolean;
  userEmail?: string | null;
  showDrafts?: boolean;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PracticeScreen({
  authEnabled = false,
  userEmail: _userEmail = null,
  showDrafts
}: PracticeScreenProps) {
  const {
    state,
    dispatch,
    speakWithOrb,
    setSpeechRate,
    handleUserSubmission,
    dismissLimitCard,
    retryLastSubmission,
    advanceExamPart
  } = useStudioState({ authEnabled, showDrafts });

  const [prefs, setPrefs] = useState<PracticePrefs>(() => ({ ...DEFAULT_PRACTICE_PREFS }));
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [examListenedCount, setExamListenedCount] = useState(0);
  const [isExamModeState, setIsExamModeState] = useState(false);
  const historySheetRef = useRef<HTMLDivElement | null>(null);

  // Check browser speech recognition capability
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    );

  // Load preferences and set document attributes
  useEffect(() => {
    const loaded = loadPracticePrefs();
    setPrefs(loaded);
    applyPracticePrefsToDocument(loaded);
    setSpeechRate(loaded.tempo);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'exam' || loaded.examMode) {
        setIsExamModeState(true);
      }
    }
  }, [setSpeechRate]);

  // Keep <html lang> synchronized with learner L1
  useEffect(() => {
    applyDocumentLang(state.l1Lang);
  }, [state.l1Lang]);

  // Speech recognition integration
  const onTranscriptChange = useCallback((text: string) => {
    setAnswerText(text);
    if (text) {
      setShowTextInput(true);
    }
  }, []);

  const onSubmitTranscript = useCallback(
    (transcript: string) => {
      void handleUserSubmission(transcript);
      setAnswerText('');
      setShowTextInput(false);
    },
    [handleUserSubmission]
  );

  const onRecordingChange = useCallback(
    (isRecording: boolean) => {
      dispatch({ type: 'SET_RECORDING', isRecording });
    },
    [dispatch]
  );

  const onSpeakingChange = useCallback(
    (isSpeaking: boolean) => {
      dispatch({ type: 'SET_SPEAKING', isSpeaking });
    },
    [dispatch]
  );

  const onStatusChange = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_MIC_STATUS', text });
    },
    [dispatch]
  );

  const onUnsupported = useCallback(() => {
    setShowTextInput(true);
  }, []);

  const { toggleMic } = useSpeechRecognition({
    inputText: answerText,
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange,
    onUnsupported,
    autoSend: prefs.autoSend
  });

  // When speech recognition is not supported in the browser, show text input by default
  useEffect(() => {
    if (!isSpeechSupported) {
      setShowTextInput(true);
    }
  }, [isSpeechSupported]);

  // Reset exam listen count when new examiner line arrives
  const latestAiReply = useMemo(() => {
    return [...state.chatHistory].reverse().find((m) => m.sender === 'ai');
  }, [state.chatHistory]);

  const latestAiText = latestAiReply?.norsk;
  useEffect(() => {
    setExamListenedCount(0);
  }, [latestAiText]);

  // Handle listening to examiner speech
  const handleListen = useCallback(() => {
    if (!latestAiReply?.norsk) return;
    if (isExamModeState && examListenedCount >= 1) return;

    setExamListenedCount((prev) => prev + 1);
    speakWithOrb(latestAiReply.norsk);
  }, [latestAiReply, isExamModeState, examListenedCount, speakWithOrb]);

  // Handle submitting learner's response
  const handleSendAnswer = useCallback(() => {
    const trimmed = answerText.trim();
    if (!trimmed || state.isThinking) return;

    void handleUserSubmission(trimmed);
    setAnswerText('');
    setShowTextInput(false);
  }, [answerText, state.isThinking, handleUserSubmission]);

  // Keyboard navigation inside History bottom sheet (Esc to close)
  useEffect(() => {
    if (!showHistory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistory]);

  // Determine current exam part name if exam mode
  const examPartName = useMemo(() => {
    if (state.examPart === 1) return 'Часть 1. Расскажите о себе';
    if (state.examPart === 2) return 'Часть 2. Опишите картинку';
    if (state.examPart === 3) return 'Часть 3. Разговор';
    return `Часть ${state.examPart}`;
  }, [state.examPart]);

  // Nora companion orb status
  const noraStatus = useMemo(() => {
    if (state.isThinking) return 'thinking';
    if (state.isRecording) return 'listening';
    if (state.isSpeaking) return 'speaking';
    return 'idle';
  }, [state.isThinking, state.isRecording, state.isSpeaking]);

  const noraStatusText = useMemo(() => {
    if (state.isThinking) return 'Нора: думает…';
    if (state.isRecording) return 'Нора: слушает';
    if (state.isSpeaking) return 'Нора: говорит';
    return 'Нора';
  }, [state.isThinking, state.isRecording, state.isSpeaking]);

  // MicButton label
  const micButtonLabel = useMemo(() => {
    if (state.isThinking) return 'Думаю…';
    if (state.isRecording) return 'Готово';
    return 'Говорить';
  }, [state.isThinking, state.isRecording]);

  const hasPriorTurns = state.chatHistory.length > 1;

  // Render subtitles highlighting if examiner line is playing
  const renderExaminerSpeech = (text: string) => {
    if (!prefs.subtitles || !state.activeSpeech || state.activeSpeech.text !== text) {
      return text;
    }
    const words = text.split(/(\s+)/);
    let cumulative = 0;
    return words.map((chunk, idx) => {
      const isWhitespace = /^\s+$/.test(chunk);
      if (isWhitespace) {
        cumulative += chunk.length;
        return chunk;
      }
      const start = cumulative;
      const end = start + chunk.length;
      cumulative += chunk.length;
      const isActive =
        state.activeSpeech!.charIndex >= start && state.activeSpeech!.charIndex <= end;
      return (
        <span
          key={idx}
          className={`practice-subtitles-word ${isActive ? 'is-active' : ''}`}
        >
          {chunk}
        </span>
      );
    });
  };

  const latestFeedback =
    state.coachingHistory.length > 0
      ? state.coachingHistory[state.coachingHistory.length - 1]
      : null;

  const isCoachFeedback = (
    c: CoachFeedback | Correction
  ): c is CoachFeedback => 'status' in c;

  return (
    <div className="practice-shell" data-testid="practiceScreen">
      {/* Accessible h1 */}
      <h1 className="visually-hidden">Практика</h1>

      {/* TOP HEADER */}
      <header className="practice-header" role="banner">
        <a href="/" className="practice-back-btn" aria-label="Назад">
          ‹
        </a>

        <div className="practice-header-center">
          <span className="practice-header-title t-callout">
            {state.currentScenario?.title || 'Практика'} · {isExamModeState ? 'Экзамен' : 'Учёба'}
          </span>
          {isExamModeState && (
            <span className="practice-header-part t-caption">{examPartName}</span>
          )}
        </div>

        <div className="practice-header-timer t-caption" aria-label="Таймер">
          {formatTimer(state.timerSeconds)}
        </div>

        {isExamModeState && (
          <button
            type="button"
            className="practice-text-btn t-caption"
            onClick={advanceExamPart}
            aria-label="Завершить часть"
          >
            Завершить часть
          </button>
        )}
      </header>

      {/* MAIN CONVERSATION COLUMN */}
      <main className="practice-main" role="main" id="chatStream">
        {/* Companion Orb Row */}
        <div className="practice-companion-row">
          <div className="practice-orb-wrap" aria-live="polite">
            <div
              className={`practice-orb ${noraStatus}`}
              data-testid="noraOrb"
              aria-hidden="true"
            />
            <span className="practice-mic-status t-caption">{noraStatusText}</span>
          </div>
        </div>

        {/* Missing Norwegian Voice Notice */}
        <VoiceNotice />

        {/* Browser without speech recognition support notice */}
        {!isSpeechSupported && (
          <div className="practice-state-card hint" role="note">
            <p className="t-body">{NO_SPEECH_SUPPORT_MESSAGE}</p>
          </div>
        )}

        {/* Microphone permission blocked notice */}
        {state.micStatusText === MIC_MESSAGES.notAllowed && (
          <div className="practice-state-card error" role="alert">
            <p className="t-body">{NO_MIC_PERMISSION_MESSAGE}</p>
          </div>
        )}

        {/* Coach unavailable calm error card */}
        {state.coachError && (
          <div className="practice-state-card error" role="alert" data-testid="coachErrorCard">
            <p className="t-body">{COACH_UNAVAILABLE_MESSAGE}</p>
            <button
              type="button"
              className="practice-outline-btn coach-retry-btn t-callout"
              onClick={retryLastSubmission}
            >
              Повторить
            </button>
          </div>
        )}

        {/* Quota limit card */}
        {state.quotaExceeded && !state.limitCardDismissed && (
          <div
            className="practice-state-card hint daily-limit-card"
            role="region"
            aria-labelledby="dailyLimitCardTitle"
            data-testid="dailyLimitCard"
          >
            <h3 id="dailyLimitCardTitle" className="t-callout">
              На сегодня бесплатные ответы закончились
            </h3>
            <p className="t-body">
              Лимит бесплатных ответов — {state.quotaExceeded.limit} в день. Завтра лимит обновится.
            </p>
            <button
              type="button"
              className="practice-outline-btn t-callout"
              onClick={dismissLimitCard}
            >
              Понятно
            </button>
          </div>
        )}

        {/* EXAMINER BLOCK */}
        {latestAiReply && (
          <section className="practice-examiner-block msg-ai" aria-label="Реплика экзаменатора">
            {/* Exam Part 2 Image illustration if available */}
            {isExamModeState && state.examPart === 2 && state.currentScenario?.image && (
              <div className="practice-image-wrap" data-testid="scenarioImageWrapper">
                <ScenarioIllustration
                  src={state.currentScenario.image.src}
                  alt={state.currentScenario.image.alt_nb}
                  className="practice-image"
                />
              </div>
            )}

            <span className="practice-examiner-badge t-caption">Экзаменатор</span>
            <p className="practice-examiner-speech msg-norsk t-speech" lang="nb">
              «{renderExaminerSpeech(latestAiReply.norsk)}»
            </p>

            {/* Translation disclosure (learning mode only) */}
            {!isExamModeState && showTranslation && (
              <p className="practice-examiner-translation t-body">
                {latestAiReply.l1 || 'Перевод недоступен'}
              </p>
            )}

            {/* Actions under examiner line */}
            <div className="practice-examiner-actions">
              {!isExamModeState && (
                <button
                  type="button"
                  className="practice-text-btn t-callout"
                  onClick={() => setShowTranslation((prev) => !prev)}
                  aria-expanded={showTranslation}
                >
                  Перевод
                </button>
              )}

              <button
                type="button"
                className="practice-text-btn t-callout"
                onClick={handleListen}
                disabled={isExamModeState && examListenedCount >= 1}
                aria-label="Слушать"
              >
                Слушать
              </button>

              {hasPriorTurns && (
                <button
                  type="button"
                  className="practice-text-btn t-callout"
                  onClick={() => setShowHistory(true)}
                  aria-label="История"
                >
                  История
                </button>
              )}
            </div>
          </section>
        )}

        {/* LEARNING MODE: CORRECTION CARD / FEEDBACK */}
        {!isExamModeState && latestFeedback && (
          <CorrectionCard
            feedback={isCoachFeedback(latestFeedback) ? latestFeedback : undefined}
            correction={!isCoachFeedback(latestFeedback) ? latestFeedback : undefined}
            showTry={!isExamModeState}
            onSpeak={speakWithOrb}
          />
        )}

        {/* LEARNER BLOCK & DOCK */}
        <section className="practice-learner-block" aria-label="Ваш ответ">
          {/* Live recording status announcement */}
          <div className="visually-hidden" aria-live="polite">
            {state.isRecording ? MIC_RECORDING_HINT : ''}
          </div>

          {/* Editable text response card */}
          {showTextInput && (
            <div className="practice-answer-card">
              <label htmlFor="userSpeechInput" className="practice-examiner-badge t-caption">
                Ваш ответ
              </label>
              <textarea
                id="userSpeechInput"
                className="practice-answer-input t-body"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Напишите ответ на норвежском..."
                lang="nb"
                rows={3}
              />
              <button
                type="button"
                id="sendSpeechBtn"
                className="practice-filled-btn t-callout"
                onClick={handleSendAnswer}
                disabled={!answerText.trim() || state.isThinking}
              >
                Отправить
              </button>
            </div>
          )}

          {/* Dock with MicButton (72 px) and text answer toggle */}
          <div className="practice-dock">
            <button
              type="button"
              id="micToggleBtn"
              className={`practice-mic-button ${state.isRecording ? 'is-recording' : ''}`}
              onClick={toggleMic}
              disabled={state.isThinking}
              aria-label={micButtonLabel}
              aria-pressed={state.isRecording}
            >
              {state.isThinking ? (
                <Loader2 size={28} className="animate-spin" aria-hidden="true" />
              ) : state.isRecording ? (
                <Square size={26} aria-hidden="true" />
              ) : (
                <Mic size={28} aria-hidden="true" />
              )}
            </button>
            <span id="micStatusText" className="practice-mic-status t-callout">
              {micButtonLabel}
            </span>

            {!showTextInput && isSpeechSupported && (
              <button
                type="button"
                className="practice-text-btn t-callout"
                onClick={() => setShowTextInput(true)}
              >
                Написать ответ
              </button>
            )}
          </div>
        </section>
      </main>

      {/* HISTORY BOTTOM SHEET */}
      {showHistory && (
        <div
          className="practice-sheet-scrim"
          onClick={() => setShowHistory(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="practiceHistoryTitle"
        >
          <div
            className="practice-sheet-content"
            ref={historySheetRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="practice-sheet-header">
              <h2 id="practiceHistoryTitle" className="t-callout">
                История диалога
              </h2>
              <button
                type="button"
                className="practice-text-btn t-callout"
                onClick={() => setShowHistory(false)}
                aria-label="Закрыть историю"
              >
                Закрыть
              </button>
            </div>

            <div className="practice-history-list">
              {state.chatHistory.length === 0 ? (
                <p className="t-body">{EMPTY_HISTORY_MESSAGE}</p>
              ) : (
                state.chatHistory.map((item, idx) => (
                  <div key={idx} className="practice-history-item">
                    <span className="practice-history-sender t-caption">
                      {item.sender === 'ai' ? 'Экзаменатор' : 'Вы'}
                    </span>
                    <p className="practice-history-text t-body" lang="nb">
                      {item.norsk}
                    </p>
                    {item.l1 && <p className="practice-history-trans t-caption">{item.l1}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

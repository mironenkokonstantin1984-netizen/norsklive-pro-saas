'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Mic, Square, Loader2, ArrowDown } from 'lucide-react';
import './practice.css';
import {
  useStudioState
} from '../studio/useStudioState';
import type { CoachFeedback, Correction } from '../../server/schemas';
import type { Scenario, ScenarioTopic, ModuleKey } from '../../content/scenarios/types';
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
import { FeedbackCard } from './FeedbackCard';
import { TopicSheet } from './TopicSheet';
import { useChatAutoScroll } from '../studio/useChatAutoScroll';
import { ScenarioIllustration } from '../../content/scenarios/images';
import {
  savePracticeResult,
  calculatePracticeScores,
  extractImprovements,
  extractStumbledWords,
  type PracticeResultData,
  type PracticeTurnSummary
} from '../../lib/practice/resultData';

export const COACH_UNAVAILABLE_MESSAGE = 'Не получилось получить ответ. Ваш ответ сохранён.';

export const NO_SPEECH_SUPPORT_MESSAGE =
  'Распознавание речи не поддерживается в этом браузере. Вы можете отвечать текстом.';

export const NO_MIC_PERMISSION_MESSAGE =
  'Доступ к микрофону заблокирован. Разрешите его в настройках браузера.';

export const EMPTY_HISTORY_MESSAGE = 'История диалога пуста.';

export const TOPIC_NAMES_RU: Record<ScenarioTopic, string> = {
  arbeid: 'Работа',
  bolig: 'Жильё',
  helse: 'Здоровье',
  familie: 'Семья',
  handel: 'Покупки',
  transport: 'Транспорт',
  fritid: 'Отдых'
};

export function getShortTopicName(scenario?: Scenario, module?: ModuleKey): string {
  if (scenario?.id?.startsWith('custom-') || scenario?.avatar === 'custom') {
    return 'Своя тема';
  }
  if (scenario?.topic && TOPIC_NAMES_RU[scenario.topic]) {
    return TOPIC_NAMES_RU[scenario.topic];
  }
  if (module === 'jobbintervju') return 'Собеседование';
  if (module === 'pensum') return 'Пенсум';
  return 'Работа';
}

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
    selectScenario,
    applyCustomSource
  } = useStudioState({ authEnabled, showDrafts });

  const [prefs, setPrefs] = useState<PracticePrefs>(() => ({ ...DEFAULT_PRACTICE_PREFS }));
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [liveText, setLiveText] = useState('');
  const [examListenedCount, setExamListenedCount] = useState(0);
  const [isExamModeState, setIsExamModeState] = useState(false);
  const [isTopicSheetOpen, setIsTopicSheetOpen] = useState(false);
  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const prevCoachingCountRef = useRef(state.coachingHistory.length);

  // Check if learner navigated from home with custom topic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const custom = window.sessionStorage.getItem('norsklive_custom_topic');
    if (custom) {
      window.sessionStorage.removeItem('norsklive_custom_topic');
      applyCustomSource(custom);
    }
  }, [applyCustomSource]);

  const historySheetRef = useRef<HTMLDivElement | null>(null);
  const chatStreamRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasRecordingRef = useRef(false);

  // Client hydration flag
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check browser speech recognition capability after hydration
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

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
      const scenarioParam = params.get('scenario');
      if (scenarioParam) {
        const allScenarios = Object.values(state.scenarios).flat();
        const match = allScenarios.find((s) => s.id === scenarioParam);
        if (match) {
          selectScenario(match);
        }
      }
    }
  }, [setSpeechRate, selectScenario, state.scenarios, state.currentModule]);

  // Keep <html lang> synchronized with learner L1
  useEffect(() => {
    applyDocumentLang(state.l1Lang);
  }, [state.l1Lang]);

  // Speech recognition integration
  const onTranscriptChange = useCallback((text: string) => {
    setAnswerText(text);
    if (text) {
      setShowTextInput(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
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
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const { toggleMic } = useSpeechRecognition({
    inputText: answerText,
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange,
    onLiveTextChange: setLiveText,
    onUnsupported,
    autoSend: prefs.autoSend
  });

  // Focus textarea when recording stops so learner can review
  useEffect(() => {
    if (wasRecordingRef.current && !state.isRecording) {
      setShowTextInput(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
    wasRecordingRef.current = state.isRecording;
  }, [state.isRecording]);

  // When speech recognition is not supported or mic permission is denied, show text input
  useEffect(() => {
    if (!isSpeechSupported || state.micStatusText === MIC_MESSAGES.notAllowed) {
      setShowTextInput(true);
    }
  }, [isSpeechSupported, state.micStatusText]);

  // Auto scroll hook
  const { showNewMessages, announcement, jumpToNewest } = useChatAutoScroll({
    streamRef: chatStreamRef,
    chatHistory: state.chatHistory,
    limitCardVisible: Boolean(state.quotaExceeded && !state.limitCardDismissed),
    errorCardVisible: Boolean(state.coachError)
  });

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

  const handleOpenTextInput = useCallback(() => {
    setShowTextInput(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  // Handle submitting learner's response
  const handleSendAnswer = useCallback(() => {
    const textToSubmit = textareaRef.current?.value || answerText;
    const trimmed = textToSubmit.trim();
    if (!trimmed || state.isThinking) return;

    void handleUserSubmission(trimmed);
    setAnswerText('');
    setShowTextInput(false);
  }, [answerText, state.isThinking, handleUserSubmission]);

  // Keyboard navigation inside History bottom sheet and materials drawer (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHistory) setShowHistory(false);
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

  // Short topic name in header
  const shortTopicName = useMemo(() => {
    return getShortTopicName(state.currentScenario, state.currentModule);
  }, [state.currentScenario, state.currentModule]);

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

  const latestUserReply = useMemo(() => {
    return [...state.chatHistory].reverse().find((m) => m.sender === 'user');
  }, [state.chatHistory]);

  const latestFeedback =
    state.coachingHistory.length > 0 ? state.coachingHistory[0] : null;

  const latestCoachFeedback: CoachFeedback | null = useMemo(() => {
    if (!latestFeedback) return null;
    if ('status' in latestFeedback) return latestFeedback as CoachFeedback;
    const corr = latestFeedback as Correction;
    const level =
      corr.cefr_estimate === 'A2' || corr.cefr_estimate === 'B2' ? corr.cefr_estimate : 'B1';
    return {
      status: 'has_errors',
      praise_l1: corr.samhandling_status || 'Хороший аргумент!',
      level_estimate: level,
      errors: [
        {
          quote: corr.original || '',
          fix: corr.natural_bokmal || '',
          type: 'other',
          rule_name_l1: 'Грамматика',
          explanation_l1: corr.grammar_rule_l1 || ''
        }
      ],
      better_version: corr.b2_upgrade
    };
  }, [latestFeedback]);

  useEffect(() => {
    if (state.coachingHistory.length > prevCoachingCountRef.current) {
      if (!isExamModeState) {
        setShowFeedbackCard(true);
      }
    }
    prevCoachingCountRef.current = state.coachingHistory.length;
  }, [state.coachingHistory.length, isExamModeState]);

  const handleNextFeedback = useCallback(() => {
    setShowFeedbackCard(false);
  }, []);

  const handleRepeatFeedback = useCallback(() => {
    setShowFeedbackCard(false);
    if (latestUserReply?.norsk) {
      setAnswerText(latestUserReply.norsk);
    }
    setShowTextInput(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [latestUserReply]);

  const finishSessionAndShowResult = useCallback(() => {
    const feedbacks: CoachFeedback[] = [];
    for (const c of state.coachingHistory) {
      if ('status' in c) {
        feedbacks.push(c as CoachFeedback);
      }
    }

    const learnerTurns = state.chatHistory.filter((m) => m.sender === 'user');
    const hasEnoughData = learnerTurns.length >= 3;

    const targetWords = state.currentScenario?.targetWords || [];
    const criteria = calculatePracticeScores(
      feedbacks,
      state.usedWords.length,
      targetWords.length
    );
    const improvements = extractImprovements(feedbacks);
    const stumbledWords = extractStumbledWords(feedbacks, targetWords);

    const turns: PracticeTurnSummary[] = state.chatHistory.map((m) => ({
      sender: m.sender,
      text: m.norsk,
      time: m.time
    }));

    const resultData: PracticeResultData = {
      id: `session-${Date.now()}`,
      scenarioId: state.currentScenario?.id || 'standard',
      scenarioTitle: state.currentScenario?.title || 'Практика',
      topicTitle: shortTopicName,
      module: state.currentModule,
      isExam: isExamModeState,
      examPart: state.examPart,
      completedAt: new Date().toISOString(),
      learnerTurnCount: learnerTurns.length,
      hasEnoughData,
      criteria,
      improvements,
      stumbledWords,
      turns
    };

    savePracticeResult(resultData);
    if (typeof window !== 'undefined') {
      window.location.assign('/practice/result');
    }
  }, [state, isExamModeState]);

  return (
    <div
      className={`practice-shell ${!isExamModeState && showFeedbackCard ? 'has-feedback-open' : ''}`}
      data-testid="practiceScreen"
      data-hydrated={mounted ? 'true' : undefined}
    >
      {/* Accessible h1 */}
      <h1 className="visually-hidden">Практика</h1>

      {/* TOP HEADER */}
      <header className="practice-header topbar" role="banner">
        <a href="/" className="practice-back-btn" aria-label="Назад">
          ‹
        </a>

        <div className="practice-header-center">
          <button
            type="button"
            className="practice-header-title practice-header-title-btn t-callout"
            onClick={() => setIsTopicSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isTopicSheetOpen}
            aria-label="Выбор темы"
          >
            {shortTopicName} · {isExamModeState ? 'Экзамен' : 'Учёба'}
          </button>
          {isExamModeState && (
            <span className="practice-header-part t-caption">{examPartName}</span>
          )}
        </div>

        <div className="practice-header-right">
          <div className="practice-header-timer t-caption" aria-label="Таймер">
            {formatTimer(state.timerSeconds)}
          </div>
        </div>
      </header>


      {/* MAIN CONVERSATION COLUMN */}
      <main className="practice-main" role="main" id="chatStream" ref={chatStreamRef}>
        {/* Prior chat history turns (stream continuity & counts for e2e tests) */}
        <div className="practice-stream-history">
          {state.chatHistory.map((item, idx) => {
            if (item === latestAiReply) return null;
            return (
              <div
                key={idx}
                className={`practice-history-msg ${item.sender === 'ai' ? 'msg-ai' : 'msg-user'}`}
              >
                {item.sender === 'ai' && <span className="msg-norsk">{item.norsk}</span>}
                {item.sender === 'user' && <span className="msg-user-text">{item.norsk}</span>}
              </div>
            );
          })}
        </div>

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
          <section
            className={`practice-examiner-block msg-ai ${!isExamModeState && showFeedbackCard ? 'is-collapsed' : ''}`}
            aria-label="Реплика экзаменатора"
          >
            {/* Image illustration if scenario has image */}
            {state.currentScenario?.image && (!isExamModeState || state.examPart === 2) && (
              <div className="practice-image-wrap" data-testid="scenarioImageWrapper">
                <ScenarioIllustration
                  src={state.currentScenario.image.src}
                  alt={state.currentScenario.image.alt_nb}
                  className="practice-image"
                />
              </div>
            )}

            <div className="practice-examiner-header">
              <span className="practice-examiner-badge t-caption">Экзаменатор</span>
              {latestAiReply.isExample && (
                <span className="msg-example-label t-caption" data-testid="exampleAnswerLabel">
                  Пример ответа
                </span>
              )}
            </div>

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

        {/* LEARNER BLOCK & DOCK */}
        <section className="practice-learner-block" aria-label="Ваш ответ">
          {/* Live recording status announcement */}
          <div className="visually-hidden" aria-live="polite">
            {state.isRecording ? MIC_RECORDING_HINT : ''}
          </div>

          {!isExamModeState && showFeedbackCard && latestCoachFeedback ? (
            <div className="practice-feedback-dock voice-dock">
              <FeedbackCard
                feedback={latestCoachFeedback}
                learnerText={latestUserReply?.norsk}
                onNext={handleNextFeedback}
                onRepeat={handleRepeatFeedback}
                onSpeak={speakWithOrb}
              />
            </div>
          ) : (
            <>
              {/* Editable text response card */}
              {showTextInput && (
                <div className="practice-answer-card">
                  <label htmlFor="userSpeechInput" className="practice-examiner-badge t-caption">
                    Ваш ответ
                  </label>
                  <textarea
                    ref={textareaRef}
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
                    disabled={state.isThinking}
                  >
                    Отправить
                  </button>
                </div>
              )}

              {/* Dock with MicButton (72 px) and text answer toggle */}
              <div className="practice-dock voice-dock">
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
                <span id="micButtonLabel" className="practice-mic-status t-callout">
                  {micButtonLabel}
                </span>
                <span id="micStatusText" className="practice-mic-status-detail t-caption">
                  {state.micStatusText}
                </span>

                {liveText ? (
                  <p id="micLiveText" className="practice-mic-live t-body" lang="nb">
                    {liveText}
                  </p>
                ) : null}

                {!showTextInput && (
                  <button
                    type="button"
                    className="practice-text-btn t-callout"
                    onClick={handleOpenTextInput}
                  >
                    Написать ответ
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {/* Floating "Новые сообщения" scroll button */}
        {showNewMessages && (
          <button
            type="button"
            className="chat-scroll-btn practice-new-messages-btn t-callout"
            onClick={jumpToNewest}
          >
            <ArrowDown size={16} strokeWidth={2} aria-hidden="true" />
            <span>Новые сообщения</span>
          </button>
        )}
        <div className="visually-hidden" aria-live="polite">
          {announcement}
        </div>
      </main>

      {/* TOPIC SELECTION SHEET */}
      <TopicSheet
        open={isTopicSheetOpen}
        onClose={() => setIsTopicSheetOpen(false)}
        selectedTopic={state.currentScenario?.topic || 'arbeid'}
        onSelectTopic={(topicId) => {
          const scs = state.scenarios[state.currentModule] || [];
          const match =
            scs.find(
              (s) => s.topic === topicId && (s.level === state.userLevel || !s.level)
            ) || scs.find((s) => s.topic === topicId);
          if (match) {
            selectScenario(match);
          }
        }}
        targetLevel={state.userLevel === 'A2' ? 'A2' : 'B1'}
        l1={state.l1Lang === 'ua' ? 'uk' : state.l1Lang}
        isExamMode={isExamModeState}
        onChangeMode={(examMode) => {
          setIsExamModeState(examMode);
        }}
        onApplyCustomText={(rawText) => {
          applyCustomSource(rawText);
        }}
        onFinishSession={finishSessionAndShowResult}
      />


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

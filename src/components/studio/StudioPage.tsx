'use client';

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import {
  EyeOff,
  Lightbulb,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  Settings,
  Sliders,
  SlidersHorizontal,
  Square,
  Volume2
} from 'lucide-react';
import { MIC_RECORDING_HINT, useSpeechRecognition } from '../../lib/useSpeechRecognition';
import {
  DEFAULT_PRACTICE_PREFS,
  applyPracticePrefsToDocument,
  loadPracticePrefs,
  savePracticePrefs,
  type LearnerMood,
  type PracticePrefs
} from '../../lib/prefs';
import { CallHero, TopBar } from './TopBar';
import { ScenarioPanel } from './ScenarioPanel';
import { TargetWordsPanel } from './TargetWordsPanel';
import { ExamStage } from './ExamStage';
import { ChatPanel } from './ChatPanel';
import { GlossaryPanel } from './GlossaryPanel';
import { ScoreBar, parseCefrLevel } from './ScoreBar';
import { PracticeSettingsSheet } from './PracticeSettingsSheet';
import {
  DEFAULT_MIC_STATUS,
  getL1Text,
  useStudioState,
  type AgentPersona,
  type CefrLevel,
  type L1Language
} from './useStudioState';

export interface StudioPageProps {
  authEnabled?: boolean;
  userEmail?: string | null;
}

export function StudioPage({ authEnabled = false, userEmail = null }: StudioPageProps = {}) {
  const {
    state,
    dispatch,
    speakWithOrb,
    setSpeechRate,
    switchModule,
    selectScenario,
    setL1Lang,
    setUserLevel,
    setAgentPersona,
    toggleBlurMode,
    restartSession,
    applyCustomSource,
    applyVacancy,
    saveToGlossary,
    handleUserSubmission,
    dismissLimitCard,
    retryLastSubmission,
    exportReportAndGlossary,
    advanceExamPart,
    speakLastAiReply
  } = useStudioState({ authEnabled });

  const [inputText, setInputText] = useState('');
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [comfortOpen, setComfortOpen] = useState(false);
  const [prefs, setPrefs] = useState<PracticePrefs>(() => ({ ...DEFAULT_PRACTICE_PREFS }));
  const comfortBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const loaded = loadPracticePrefs();
    setPrefs(loaded);
    applyPracticePrefsToDocument(loaded);
    setSpeechRate(loaded.tempo);
  }, [setSpeechRate]);

  const handleChangePrefs = useCallback(
    (nextPrefs: PracticePrefs) => {
      setPrefs(nextPrefs);
      savePracticePrefs(nextPrefs);
      applyPracticePrefsToDocument(nextPrefs);
      setSpeechRate(nextPrefs.tempo);
    },
    [setSpeechRate]
  );

  const handleCloseComfort = useCallback(() => {
    setComfortOpen(false);
    comfortBtnRef.current?.focus();
  }, []);

  const handleSelectMood = useCallback(
    (mood: LearnerMood) => {
      const nextPrefs: PracticePrefs = {
        ...prefs,
        mood,
        timestamp: new Date().toISOString()
      };
      setPrefs(nextPrefs);
      savePracticePrefs(nextPrefs);
    },
    [prefs]
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

  const onSubmitTranscript = useCallback(
    (transcript: string) => {
      void handleUserSubmission(transcript);
    },
    [handleUserSubmission]
  );

  const [liveText, setLiveText] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const onTranscriptChange = useCallback((text: string) => {
    setInputText(text);
    if (text) {
      // Let the learner review and edit the recognised text before sending.
      textInputRef.current?.focus();
    }
  }, []);

  const onUnsupported = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  const { toggleMic } = useSpeechRecognition({
    inputText,
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange,
    onLiveTextChange: setLiveText,
    onUnsupported,
    autoSend: prefs.autoSend
  });

  useEffect(() => {
    if (!state.isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const id = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.isRecording]);

  const currentModuleScenarios = state.scenarios[state.currentModule] || [];
  const currentScenario = state.currentScenario;
  const hints = state.hints || [];
  const latestScoreLevel = parseCefrLevel(state.coachingHistory[0]?.cefr_estimate);

  const handleSend = () => {
    const clean = inputText.trim();
    if (!clean) return;
    setInputText('');
    void handleUserSubmission(clean);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleHintClick = (norskText: string) => {
    setInputText('');
    void handleUserSubmission(norskText);
  };

  const handleToggleMaterials = useCallback(() => {
    setMaterialsOpen((prev) => !prev);
  }, []);

  const micLabel = state.isRecording ? 'Готово' : state.isThinking ? 'Думаю' : 'Snakk';
  const recMins = String(Math.floor(recordingSeconds / 60));
  const recSecs = String(recordingSeconds % 60).padStart(2, '0');
  // Part 1 of the oral exam is a 2-minute monologue: show the allowed time next to the timer.
  const showMonologueLimit = state.currentModule === 'norskprove' && state.examPart === 1;
  const recordingTimerText = `${recMins}:${recSecs}${showMonologueLimit ? ' / 2:00' : ''}`;
  // The timer is already shown under the button; the status line says how to finish.
  const displayMicStatus = state.isRecording
    ? MIC_RECORDING_HINT
    : state.isThinking
      ? 'Экзаменатор отвечает'
      : state.micStatusText || DEFAULT_MIC_STATUS;

  return (
    <div className="studio-shell">
      <TopBar
        currentModule={state.currentModule}
        authEnabled={authEnabled}
        userEmail={userEmail}
        materialsOpen={materialsOpen}
        onToggleMaterials={handleToggleMaterials}
        onSwitchModule={switchModule}
      />

      <main className={`studio-layout ${materialsOpen ? 'materials-open' : ''}`}>
        {/* CENTER CONVERSATION COLUMN (max 640px, calm reading flow) */}
        <section className="panel conversation-column">
          <CallHero
            currentModule={state.currentModule}
            currentScenario={currentScenario}
            examPart={state.examPart}
            timerSeconds={state.timerSeconds}
            isListening={state.isRecording}
            isSpeaking={state.isSpeaking}
            onAdvanceExamPart={advanceExamPart}
          />

          <ExamStage
            currentModule={state.currentModule}
            currentScenario={currentScenario}
            examPart={state.examPart}
          />

          <ChatPanel
            chatHistory={state.chatHistory}
            coachingHistory={state.coachingHistory}
            partnerName={currentScenario.partnerName}
            l1Lang={state.l1Lang}
            blurMode={state.blurMode}
            subtitlesEnabled={prefs.subtitles}
            examMode={prefs.examMode}
            activeSpeech={state.activeSpeech}
            quotaExceeded={state.quotaExceeded}
            limitCardDismissed={state.limitCardDismissed}
            onDismissLimitCard={dismissLimitCard}
            coachError={state.coachError}
            isThinking={state.isThinking}
            onRetry={retryLastSubmission}
            onSpeak={speakWithOrb}
            onSaveToGlossary={saveToGlossary}
            onSelectMood={handleSelectMood}
          />

          {/* Bottom Microphone & Voice Dock (72px circular MicButton + status + one-row input & text send button) */}
          <div className="voice-dock">
            <div className="mic-dock-top">
              <button
                type="button"
                id="micToggleBtn"
                className={`mic-button ${state.isRecording ? 'recording' : ''} ${
                  state.isThinking ? 'processing' : ''
                }`}
                aria-pressed={state.isRecording}
                aria-label={micLabel}
                title={
                  state.quotaExceeded
                    ? 'Лимит на сегодня исчерпан'
                    : 'Нажми и говори по-норвежски (nb-NO)'
                }
                disabled={Boolean(state.quotaExceeded)}
                onClick={toggleMic}
              >
                {state.isRecording && <span className="mic-breathing-ring" aria-hidden="true" />}
                {state.isThinking ? (
                  <Loader2 size={24} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                ) : state.isRecording ? (
                  <Square size={24} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                ) : (
                  <Mic size={24} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                )}
                <span className="mic-button-label t-caption" id="micButtonLabel">
                  {micLabel}
                </span>
              </button>
              {state.isRecording && (
                <span className="mic-recording-timer t-caption" id="micRecordingTimer">
                  {recordingTimerText}
                </span>
              )}
              {state.isRecording && liveText ? (
                <p className="mic-live-text t-body" id="micLiveText" lang="nb">
                  {liveText}
                </p>
              ) : null}
              <div className="voice-status-line t-caption" aria-live="polite">
                <span id="micStatusText">
                  {state.quotaExceeded ? 'Лимит на сегодня исчерпан' : displayMicStatus}
                </span>
                {state.usedWordsToast ? (
                  <span id="usedWordsToast" className="used-words-toast">
                    {state.usedWordsToast}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="voice-input-row">
              <input
                ref={textInputRef}
                type="text"
                id="userSpeechInput"
                className="voice-text-input"
                placeholder={
                  state.quotaExceeded ? 'Лимит на сегодня исчерпан' : 'Или напишите ответ'
                }
                disabled={Boolean(state.quotaExceeded)}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                id="sendSpeechBtn"
                className="send-btn btn-text"
                disabled={Boolean(state.quotaExceeded)}
                title={state.quotaExceeded ? 'Лимит на сегодня исчерпан' : undefined}
                onClick={handleSend}
              >
                <Send size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>Отправить</span>
              </button>
            </div>
          </div>
        </section>

        {/* PROGRESSIVE DISCLOSURE DRAWER: НАСТРОЙКИ, ЭКЗАМЕН, SCENARIOS, TELEPROMPTER, TARGET WORDS, GLOSSARY */}
        <aside
          id="materialsDrawer"
          className={`materials-drawer ${materialsOpen ? 'is-open' : 'is-closed'}`}
          aria-label="Материалы и настройки"
        >
          {/* Top of Материалы: Header with «Удобство» button + ScoreBar («Общая оценка») */}
          <section className="panel drawer-group materials-overview-panel">
            <div className="panel-header">
              <div className="panel-title">
                <span>Материалы</span>
              </div>
              <button
                type="button"
                id="comfortSettingsBtn"
                ref={comfortBtnRef}
                className="btn-text comfort-trigger-btn"
                aria-expanded={comfortOpen}
                aria-haspopup="dialog"
                onClick={() => setComfortOpen(true)}
              >
                <SlidersHorizontal
                  size={20}
                  strokeWidth={1.75}
                  color="currentColor"
                  aria-hidden="true"
                />
                <span>Удобство</span>
              </button>
            </div>
            <div className="panel-body materials-score-section">
              <ScoreBar label="Общая оценка" level={latestScoreLevel} />
              <p className="scorebar-disclaimer t-caption">
                Оценка ориентировочная, это тренажёр, а не экзамен.
              </p>
            </div>
          </section>

          {/* Group 1: Настройки (L1 & Mål selects) */}
          <section className="panel drawer-group">
            <div className="panel-header">
              <div className="panel-title">
                <Settings size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>Настройки</span>
              </div>
            </div>
            <div className="panel-body drawer-controls-grid">
              <label className="drawer-field t-caption" htmlFor="l1LangSelect">
                <span>Язык объяснений (L1)</span>
                <select
                  id="l1LangSelect"
                  className="level-selector"
                  title="Родной язык микро-коррекций (L1)"
                  value={state.l1Lang}
                  onChange={(e) => setL1Lang(e.target.value as L1Language)}
                >
                  <option value="ru">L1: Русский (Коррекции)</option>
                  <option value="ua">L1: Українська</option>
                  <option value="en">L1: English</option>
                </select>
              </label>

              <label className="drawer-field t-caption" htmlFor="userLevelSelect">
                <span>Целевой уровень (Mål)</span>
                <select
                  id="userLevelSelect"
                  className="level-selector"
                  title="Целевой уровень CEFR"
                  value={state.userLevel}
                  onChange={(e) => setUserLevel(e.target.value as CefrLevel)}
                >
                  <option value="A2">Mål: A2 (UDI Opphold)</option>
                  <option value="B1">Mål: B1 (UDI / Statsborgerskap)</option>
                  <option value="B2">Mål: B2 (Høyere utdanning / B2B)</option>
                </select>
              </label>
            </div>
          </section>

          {/* Group 2: Экзамен (Агент, Blur, Сброс & Подсказки) */}
          <section className="panel drawer-group">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>Экзамен</span>
              </div>
            </div>
            <div className="panel-body">
              <label className="drawer-field t-caption" htmlFor="agentPersonaSelect">
                <span>Агент (Samhandling)</span>
                <select
                  id="agentPersonaSelect"
                  className="level-selector"
                  title="Поведение второго ИИ-агента (Samhandling)"
                  value={state.agentPersona}
                  onChange={(e) => setAgentPersona(e.target.value as AgentPersona)}
                >
                  <option value="standard">Агент: Стандартный экзамен / HR</option>
                  <option value="interrupting">Medkandidat: Спорящий и перебивающий</option>
                  <option value="passive">Medkandidat: Пассивный (разговори его!)</option>
                </select>
              </label>

              <div className="drawer-action-row">
                <button
                  type="button"
                  className={`pill-btn ${state.blurMode ? 'active' : ''}`}
                  id="blurToggleBtn"
                  title="Скрыть текст для тренировки чистого аудирования"
                  onClick={toggleBlurMode}
                >
                  <EyeOff size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                  <span>Blur (Аудирование)</span>
                </button>

                <button
                  type="button"
                  className="pill-btn"
                  id="restartSessionBtn"
                  title="Перезапустить сессию"
                  onClick={restartSession}
                >
                  <RotateCcw size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                  <span>Сброс</span>
                </button>
              </div>

              {prefs.examMode ? null : (
                <div className="teleprompter-box" id="hintsBox">
                  <div className="teleprompter-header t-caption">
                    <span className="teleprompter-title">
                      <Lightbulb
                        size={20}
                        strokeWidth={1.75}
                        color="currentColor"
                        aria-hidden="true"
                      />
                      <span>Подсказки (Svar-forslag)</span>
                    </span>
                    <button
                      type="button"
                      id="speakHintBtn"
                      className="mini-action-btn"
                      onClick={speakLastAiReply}
                    >
                      <Volume2
                        size={20}
                        strokeWidth={1.75}
                        color="currentColor"
                        aria-hidden="true"
                      />
                      <span>Повторить вопрос ИИ</span>
                    </button>
                  </div>
                  <div className="hints-list" id="hintsContainer">
                    {hints.map((h) => {
                      const l1Hint = getL1Text(h, state.l1Lang, 'ru');
                      return (
                        <div
                          key={`${h.label}-${h.norsk}`}
                          className="hint-card"
                          onClick={() => handleHintClick(h.norsk)}
                        >
                          <div className="hint-label t-caption">
                            <Lightbulb
                              size={20}
                              strokeWidth={1.75}
                              color="currentColor"
                              aria-hidden="true"
                            />
                            <span>{h.label}</span>
                          </div>
                          <div className="hint-norsk">{`«${h.norsk}»`}</div>
                          <div className="hint-ru t-caption">{l1Hint}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <ScenarioPanel
            currentModule={state.currentModule}
            scenarios={currentModuleScenarios}
            currentScenario={currentScenario}
            onSelectScenario={selectScenario}
            onApplyCustomSource={applyCustomSource}
            onApplyVacancy={applyVacancy}
          >
            <TargetWordsPanel
              targetWords={currentScenario.targetWords || []}
              usedWords={state.usedWords}
              l1Lang={state.l1Lang}
              onSaveToGlossary={saveToGlossary}
            />
          </ScenarioPanel>

          <GlossaryPanel
            savedGlossary={state.savedGlossary}
            usedWordsCount={state.usedWords.length}
            totalTargetWords={(currentScenario.targetWords || []).length}
            coachingHistory={state.coachingHistory}
            hkdirScores={state.hkdirScores}
            l1Lang={state.l1Lang}
            onSpeak={speakWithOrb}
            onSaveToGlossary={saveToGlossary}
            onExportReport={exportReportAndGlossary}
          />
        </aside>
      </main>

      <PracticeSettingsSheet
        open={comfortOpen}
        prefs={prefs}
        onChangePrefs={handleChangePrefs}
        onClose={handleCloseComfort}
      />
    </div>
  );
}

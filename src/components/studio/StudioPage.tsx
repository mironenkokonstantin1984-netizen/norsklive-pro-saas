'use client';

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import {
  Loader2,
  Mic,
  Send,
  Square
} from 'lucide-react';
import {
  MIC_MESSAGES,
  MIC_RECORDING_HINT,
  useSpeechRecognition
} from '../../lib/useSpeechRecognition';
import {
  DEFAULT_PRACTICE_PREFS,
  applyPracticePrefsToDocument,
  loadPracticePrefs,
  savePracticePrefs,
  type LearnerMood,
  type PracticePrefs
} from '../../lib/prefs';
import { CallHero, TopBar } from './TopBar';
import { ChatPanel } from './ChatPanel';
import { VoiceNotice } from './VoiceNotice';
import {
  DEFAULT_MIC_STATUS,
  useStudioState
} from './useStudioState';

export interface StudioPageProps {
  authEnabled?: boolean;
  userEmail?: string | null;
  showDrafts?: boolean;
}

export function StudioPage({
  authEnabled = false,
  userEmail = null,
  showDrafts
}: StudioPageProps = {}) {
  const {
    state,
    dispatch,
    setSpeechRate,
    speakWithOrb,
    saveToGlossary,
    handleUserSubmission,
    dismissLimitCard,
    retryLastSubmission,
    advanceExamPart
  } = useStudioState({ authEnabled, showDrafts });

  const [inputText, setInputText] = useState('');
  const [prefs, setPrefs] = useState<PracticePrefs>(() => ({ ...DEFAULT_PRACTICE_PREFS }));

  useEffect(() => {
    const loaded = loadPracticePrefs();
    setPrefs(loaded);
    applyPracticePrefsToDocument(loaded);
    setSpeechRate(loaded.tempo);
  }, [setSpeechRate]);

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

  const currentScenario = state.currentScenario;

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
  const micStatusIsError =
    !state.isRecording &&
    !state.isThinking &&
    (Object.values(MIC_MESSAGES) as string[]).includes(state.micStatusText);

  return (
    <div className="studio-shell">
      <TopBar
        currentModule={state.currentModule}
        authEnabled={authEnabled}
        userEmail={userEmail}
      />

      <VoiceNotice />

      <main className="studio-layout">
        <h1 className="sr-only" id="studioHeading">
          Практика
        </h1>
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

          <ChatPanel
            chatHistory={state.chatHistory}
            coachingHistory={state.coachingHistory}
            partnerName={currentScenario.partnerName}
            l1Lang={state.l1Lang}
            blurMode={state.blurMode}
            subtitlesEnabled={prefs.subtitles}
            examMode={prefs.examMode}
            scenarioImage={currentScenario.image}
            scenarioStatus={currentScenario.status}
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
              <div className="voice-status-line t-caption">
                {/* Status changes are read politely; a microphone error is an alert. */}
                <span id="micStatusText" role={micStatusIsError ? 'alert' : 'status'}>
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
      </main>
    </div>
  );
}

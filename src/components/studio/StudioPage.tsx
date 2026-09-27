'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Lightbulb, Loader2, Mic, Send, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { CallHero, TopBar } from './TopBar';
import { ScenarioPanel } from './ScenarioPanel';
import { TargetWordsPanel } from './TargetWordsPanel';
import { ExamStage } from './ExamStage';
import { ChatPanel } from './ChatPanel';
import { GlossaryPanel } from './GlossaryPanel';
import { getL1Text, useStudioState } from './useStudioState';

export interface StudioPageProps {
  authEnabled?: boolean;
  userEmail?: string | null;
}

export function StudioPage({ authEnabled = false, userEmail = null }: StudioPageProps = {}) {
  const {
    state,
    dispatch,
    speakWithOrb,
    switchModule,
    selectScenario,
    setL1Lang,
    setUserLevel,
    setAgentPersona,
    toggleBlurMode,
    restartSession,
    applyCustomSource,
    saveToGlossary,
    handleUserSubmission,
    exportReportAndGlossary,
    advanceExamPart,
    speakLastAiReply
  } = useStudioState();

  const [inputText, setInputText] = useState('');
  const [materialsOpen, setMaterialsOpen] = useState(false);

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

  const { toggleMic } = useSpeechRecognition({
    inputText,
    onTranscriptChange: setInputText,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange
  });

  const currentModuleScenarios = state.scenarios[state.currentModule] || [];
  const currentScenario = state.currentScenario;
  const hints = state.hints || [];

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

  const micLabel = state.isRecording ? 'Слушаю' : state.isThinking ? 'Думаю' : 'Snakk';
  const recMins = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
  const recSecs = String(state.timerSeconds % 60).padStart(2, '0');

  return (
    <div className="studio-shell">
      <TopBar
        currentModule={state.currentModule}
        l1Lang={state.l1Lang}
        userLevel={state.userLevel}
        authEnabled={authEnabled}
        userEmail={userEmail}
        materialsOpen={materialsOpen}
        onToggleMaterials={handleToggleMaterials}
        onSwitchModule={switchModule}
        onChangeL1Lang={setL1Lang}
        onChangeUserLevel={setUserLevel}
      />

      <main className={`studio-layout ${materialsOpen ? 'materials-open' : ''}`}>
        {/* CENTER CONVERSATION COLUMN (max 640px, calm reading flow) */}
        <section className="panel conversation-column">
          <CallHero
            currentModule={state.currentModule}
            currentScenario={currentScenario}
            agentPersona={state.agentPersona}
            blurMode={state.blurMode}
            examPart={state.examPart}
            timerSeconds={state.timerSeconds}
            isListening={state.isRecording}
            isSpeaking={state.isSpeaking}
            onChangeAgentPersona={setAgentPersona}
            onToggleBlur={toggleBlurMode}
            onAdvanceExamPart={advanceExamPart}
            onRestartSession={restartSession}
          />

          <ExamStage
            currentModule={state.currentModule}
            currentScenario={currentScenario}
            examPart={state.examPart}
          />

          <ChatPanel
            chatHistory={state.chatHistory}
            partnerName={currentScenario.partnerName}
            l1Lang={state.l1Lang}
            blurMode={state.blurMode}
            onSpeak={speakWithOrb}
            onSaveToGlossary={saveToGlossary}
          />

          {/* Teleprompter / Lifesaver Hints */}
          <div className="teleprompter-box">
            <div className="teleprompter-header t-caption">
              <span className="teleprompter-title">
                <Lightbulb size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>
                  Динамический Телесуфлёр (Svar-forslag med målord · Кликни или произнеси в
                  микрофон)
                </span>
              </span>
              <button
                type="button"
                id="speakHintBtn"
                className="mini-action-btn"
                onClick={speakLastAiReply}
              >
                <Volume2 size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
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

          {/* Bottom Microphone & Voice Dock (One primary action: 72px MicButton) */}
          <div className="voice-dock">
            <div className="mic-dock-primary">
              <button
                type="button"
                id="micToggleBtn"
                className={`mic-button ${state.isRecording ? 'recording' : ''} ${
                  state.isThinking ? 'processing' : ''
                }`}
                aria-pressed={state.isRecording}
                aria-label={micLabel}
                title="Нажми и говори по-норвежски (nb-NO)"
                onClick={toggleMic}
              >
                {state.isRecording && (
                  <span className="mic-breathing-ring" aria-hidden="true" />
                )}
                {state.isThinking ? (
                  <Loader2 size={24} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                ) : (
                  <Mic size={24} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                )}
                <span className="mic-button-label t-caption" id="micButtonLabel">
                  {micLabel}
                </span>
              </button>
              {state.isRecording && (
                <span className="mic-recording-timer t-caption" id="micRecordingTimer">
                  {`${recMins}:${recSecs}`}
                </span>
              )}
            </div>

            <div className="voice-input-wrap">
              <input
                type="text"
                id="userSpeechInput"
                className="voice-text-input"
                placeholder="Говорите по-норвежски или введите фразу здесь (например: «Jeg tenker at miljø er viktig»)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="voice-status-line t-caption">
                <span id="micStatusText">{state.micStatusText}</span>
                <span id="usedWordsToast" className="used-words-toast">
                  {state.usedWordsToast}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="sendSpeechBtn"
              className="send-btn btn-outline"
              onClick={handleSend}
            >
              <Send size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>Отправить</span>
            </button>
          </div>
        </section>

        {/* PROGRESSIVE DISCLOSURE DRAWER: SCENARIOS, TARGET WORDS, GLOSSARY & COACHING */}
        <aside
          id="materialsDrawer"
          className={`materials-drawer ${materialsOpen ? 'is-open' : 'is-closed'}`}
          aria-label="Материалы и разбор"
        >
          <ScenarioPanel
            currentModule={state.currentModule}
            scenarios={currentModuleScenarios}
            currentScenario={currentScenario}
            onSelectScenario={selectScenario}
            onApplyCustomSource={applyCustomSource}
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
    </div>
  );
}

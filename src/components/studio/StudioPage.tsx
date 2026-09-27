'use client';

import { useState, type KeyboardEvent } from 'react';
import { CallHero, TopBar } from './TopBar';
import { ScenarioPanel } from './ScenarioPanel';
import { TargetWordsPanel } from './TargetWordsPanel';
import { ExamStage } from './ExamStage';
import { ChatPanel } from './ChatPanel';
import { GlossaryPanel } from './GlossaryPanel';
import { getL1Text, useStudioState } from './useStudioState';

export function StudioPage() {
  const {
    state,
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

  return (
    <div>
      <TopBar
        currentModule={state.currentModule}
        l1Lang={state.l1Lang}
        userLevel={state.userLevel}
        onSwitchModule={switchModule}
        onChangeL1Lang={setL1Lang}
        onChangeUserLevel={setUserLevel}
      />

      <main className="studio-layout">
        {/* LEFT COLUMN: SCENARIOS, CUSTOM TEXT / 10-WORD GENERATOR & ACTIVE VOCAB BINGO */}
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

        {/* CENTER COLUMN: MULTI-AGENT CALL STUDIO, EXAM STAGE & CHAT STREAM */}
        <section className="panel">
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
            <div className="teleprompter-header">
              <span>
                💡 Динамический Телесуфлёр (Svar-forslag med målord · Кликни или произнеси в
                микрофон)
              </span>
              <button
                type="button"
                id="speakHintBtn"
                className="mini-action-btn"
                onClick={speakLastAiReply}
              >
                🔊 Повторить вопрос ИИ
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
                    <div className="hint-label">{`💡 ${h.label}`}</div>
                    <div className="hint-norsk">{`«${h.norsk}»`}</div>
                    <div className="hint-ru">{l1Hint}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Microphone & Voice Dock */}
          <div className="voice-dock">
            <button
              type="button"
              id="micToggleBtn"
              className={`mic-button ${state.isRecording ? 'recording' : ''}`}
              title="Нажми и говори по-норвежски (nb-NO)"
            >
              🎙️
            </button>
            <div className="voice-input-wrap">
              <input
                type="text"
                id="userSpeechInput"
                className="voice-text-input"
                placeholder="Нажми 🎙️ и говори по-норвежски (или напиши фразу здесь, например: «Jeg tenker at miljø er viktig»)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="voice-status-line">
                <span id="micStatusText">{state.micStatusText}</span>
                <span
                  id="usedWordsToast"
                  style={{ color: '#34d399', fontWeight: 700 }}
                >
                  {state.usedWordsToast}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="sendSpeechBtn"
              className="send-btn"
              onClick={handleSend}
            >
              Отправить ➤
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: L1 MICRO-CORRECTIONS, HK-DIR SCORECARD & GLOSSARY */}
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
      </main>
    </div>
  );
}

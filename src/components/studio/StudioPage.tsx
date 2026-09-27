'use client';

import { speakNorwegian } from '../../lib/speech';
import { CallHero, TopBar } from './TopBar';
import { ScenarioPanel } from './ScenarioPanel';
import { TargetWordsPanel } from './TargetWordsPanel';
import { ExamStage } from './ExamStage';
import { GlossaryPanel } from './GlossaryPanel';
import { getL1Text, useStudioState } from './useStudioState';

export function StudioPage() {
  const {
    state,
    switchModule,
    selectScenario,
    setL1Lang,
    setUserLevel,
    setAgentPersona,
    toggleBlurMode,
    restartSession,
    applyCustomSource,
    saveToGlossary,
    exportReportAndGlossary,
    advanceExamPart
  } = useStudioState();

  const currentModuleScenarios = state.scenarios[state.currentModule] || [];
  const currentScenario = state.currentScenario;
  const hints = currentScenario.hints || [];

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

        {/* CENTER COLUMN: MULTI-AGENT CALL STUDIO, EXAM STAGE & PLACEHOLDER FOR CHAT */}
        <section className="panel">
          <CallHero
            currentModule={state.currentModule}
            currentScenario={currentScenario}
            agentPersona={state.agentPersona}
            blurMode={state.blurMode}
            examPart={state.examPart}
            timerSeconds={state.timerSeconds}
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

          {/* Chat / Transcript Stream Placeholder (M1a-2) */}
          <div className="chat-stream" id="chatStream">
            <div className="msg-bubble msg-ai">
              <div className="msg-meta">
                <span>{`🇳🇴 ${currentScenario.partnerName}`}</span>
                <span>M1a-2</span>
              </div>
              <div className="msg-norsk">{currentScenario.openingLine}</div>
              <div className="msg-translation">Chat — coming in M1a-3</div>
            </div>
          </div>

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
                onClick={() => speakNorwegian(currentScenario.openingLine)}
              >
                🔊 Повторить вопрос ИИ
              </button>
            </div>
            <div className="hints-list" id="hintsContainer">
              {hints.map((h) => {
                const l1Hint = getL1Text(h, state.l1Lang, 'ru');
                return (
                  <div
                    key={h.label}
                    className="hint-card"
                    onClick={() => speakNorwegian(h.norsk)}
                  >
                    <div className="hint-label">{`💡 ${h.label}`}</div>
                    <div className="hint-norsk">{`«${h.norsk}»`}</div>
                    <div className="hint-ru">{l1Hint}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Microphone & Voice Dock Placeholder */}
          <div className="voice-dock">
            <button
              type="button"
              id="micToggleBtn"
              className="mic-button"
              title="Chat — coming in M1a-3"
              disabled
            >
              🎙️
            </button>
            <div className="voice-input-wrap">
              <input
                type="text"
                id="userSpeechInput"
                className="voice-text-input"
                placeholder="Chat — coming in M1a-3"
                disabled
              />
              <div className="voice-status-line">
                <span id="micStatusText">Chat — coming in M1a-3</span>
                <span
                  id="usedWordsToast"
                  style={{ color: '#34d399', fontWeight: 700 }}
                ></span>
              </div>
            </div>
            <button type="button" id="sendSpeechBtn" className="send-btn" disabled>
              Отправить ➤
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: L1 MICRO-CORRECTIONS, HK-DIR SCORECARD & GLOSSARY */}
        <GlossaryPanel
          savedGlossary={state.savedGlossary}
          usedWordsCount={state.usedWords.length}
          totalTargetWords={(currentScenario.targetWords || []).length}
          onExportReport={exportReportAndGlossary}
        />
      </main>
    </div>
  );
}

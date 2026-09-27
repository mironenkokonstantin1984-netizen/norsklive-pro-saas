'use client';

import type { ModuleKey, Scenario } from '../../content/scenarios';
import type { AgentPersona, CefrLevel, L1Language } from './useStudioState';

export interface TopBarProps {
  currentModule: ModuleKey;
  l1Lang: L1Language;
  userLevel: CefrLevel;
  onSwitchModule: (module: ModuleKey) => void;
  onChangeL1Lang: (l1: L1Language) => void;
  onChangeUserLevel: (level: CefrLevel) => void;
}

export function TopBar({
  currentModule,
  l1Lang,
  userLevel,
  onSwitchModule,
  onChangeL1Lang,
  onChangeUserLevel
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-flag">🇳🇴</div>
        <div>
          <div className="brand-title">
            NorskLive Pro
            <span className="brand-badge">Muntlig AI Språkpartner</span>
          </div>
          <div className="brand-sub">
            HK-dir Multi-Agent · Jobbintervju · Kopinor-Safe CEFR · L2 ASR
          </div>
        </div>
      </div>

      {/* 3 Core Training Modules */}
      <nav className="module-tabs" id="moduleTabs">
        <button
          type="button"
          className={`module-tab ${currentModule === 'norskprove' ? 'active' : ''}`}
          data-module="norskprove"
          onClick={() => onSwitchModule('norskprove')}
        >
          🎓 1. Norskprøve Muntlig (HK-dir)
        </button>
        <button
          type="button"
          className={`module-tab ${currentModule === 'jobbintervju' ? 'active' : ''}`}
          data-module="jobbintervju"
          onClick={() => onSwitchModule('jobbintervju')}
        >
          💼 2. Jobbintervju på norsk
        </button>
        <button
          type="button"
          className={`module-tab ${currentModule === 'pensum' ? 'active' : ''}`}
          data-module="pensum"
          onClick={() => onSwitchModule('pensum')}
        >
          🛡️ 3. CEFR Teleprompter
        </button>
      </nav>

      <div className="top-controls">
        {/* L1 Native Micro-Correction Language Selector */}
        <select
          id="l1LangSelect"
          className="level-selector"
          title="Родной язык микро-коррекций (L1)"
          value={l1Lang}
          onChange={(e) => onChangeL1Lang(e.target.value as L1Language)}
        >
          <option value="ru">🇷🇺 L1: Русский (Коррекции)</option>
          <option value="ua">🇺🇦 L1: Українська</option>
          <option value="en">🇬🇧 L1: English</option>
        </select>

        <select
          id="userLevelSelect"
          className="level-selector"
          title="Целевой уровень CEFR"
          value={userLevel}
          onChange={(e) => onChangeUserLevel(e.target.value as CefrLevel)}
        >
          <option value="A2">Mål: A2 (UDI Opphold)</option>
          <option value="B1">Mål: B1 (UDI / Statsborgerskap)</option>
          <option value="B2">Mål: B2 (Høyere utdanning / B2B)</option>
        </select>
      </div>
    </header>
  );
}

export interface CallHeroProps {
  currentModule: ModuleKey;
  currentScenario: Scenario;
  agentPersona: AgentPersona;
  blurMode: boolean;
  examPart: number;
  timerSeconds: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  onChangeAgentPersona: (persona: AgentPersona) => void;
  onToggleBlur: () => void;
  onAdvanceExamPart: () => void;
  onRestartSession: () => void;
}

export function CallHero({
  currentModule,
  currentScenario,
  agentPersona,
  blurMode,
  examPart,
  timerSeconds,
  isListening = false,
  isSpeaking = false,
  onChangeAgentPersona,
  onToggleBlur,
  onAdvanceExamPart,
  onRestartSession
}: CallHeroProps) {
  const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const secs = String(timerSeconds % 60).padStart(2, '0');
  const showExamControls =
    currentModule === 'norskprove' && Boolean(currentScenario.examStructure);

  const examBtnLabel =
    examPart === 1
      ? '⏭️ К Этапу 2 (Дебаты с Medkandidat)'
      : examPart === 2
        ? '⏭️ К Этапу 3 (Вопросы Sensor HK-dir)'
        : '✅ Завершить и скачать вердикт HK-dir';

  const orbClasses = [
    'voice-orb-wrap',
    isListening ? 'listening' : '',
    !isListening && isSpeaking ? 'speaking' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="call-hero">
      <div className="partner-profile">
        <div className={orbClasses} id="voiceOrb">
          <div className="voice-orb-ring"></div>
          <div className="partner-avatar" id="partnerAvatar">
            {currentScenario.avatar || '🇳🇴'}
          </div>
        </div>
        <div className="partner-info">
          <h2 id="partnerName">{currentScenario.partnerName}</h2>
          <p id="partnerRole">{`${currentScenario.badge} · ${currentScenario.partnerRole}`}</p>
        </div>
      </div>

      <div className="call-toolbar">
        <select
          id="agentPersonaSelect"
          className="level-selector"
          title="Поведение второго ИИ-агента (Samhandling)"
          value={agentPersona}
          onChange={(e) => onChangeAgentPersona(e.target.value as AgentPersona)}
        >
          <option value="standard">🤝 Агент: Стандартный экзамен / HR</option>
          <option value="interrupting">⚡ Medkandidat: Спорящий и перебивающий</option>
          <option value="passive">😳 Medkandidat: Пассивный (разговори его!)</option>
        </select>

        <button
          type="button"
          className={`pill-btn ${blurMode ? 'active' : ''}`}
          id="blurToggleBtn"
          title="Скрыть текст для тренировки чистого аудирования"
          onClick={onToggleBlur}
        >
          👁️ Blur (Аудирование)
        </button>

        {showExamControls && (
          <button
            type="button"
            className="pill-btn"
            id="examPartBtn"
            onClick={onAdvanceExamPart}
          >
            {examBtnLabel}
          </button>
        )}

        <div className="exam-timer-badge" id="sessionTimerBadge">
          {`⏱️ ${mins}:${secs}`}
        </div>

        <button
          type="button"
          className="pill-btn"
          id="restartSessionBtn"
          title="Перезапустить сессию"
          onClick={onRestartSession}
        >
          🔄 Сброс
        </button>
      </div>
    </div>
  );
}

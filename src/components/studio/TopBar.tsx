'use client';

import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  SkipForward,
  SlidersHorizontal,
  User
} from 'lucide-react';
import type { ModuleKey, Scenario } from '../../content/scenarios';
import type { AgentPersona, CefrLevel, L1Language } from './useStudioState';

export interface TopBarProps {
  currentModule: ModuleKey;
  l1Lang?: L1Language;
  userLevel?: CefrLevel;
  authEnabled?: boolean;
  userEmail?: string | null;
  materialsOpen?: boolean;
  onToggleMaterials?: () => void;
  onSwitchModule: (module: ModuleKey) => void;
  onChangeL1Lang?: (l1: L1Language) => void;
  onChangeUserLevel?: (level: CefrLevel) => void;
}

export function TopBar({
  currentModule,
  authEnabled = false,
  userEmail = null,
  materialsOpen = false,
  onToggleMaterials,
  onSwitchModule
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <div className="brand-flag" aria-hidden="true">
            <Globe size={20} strokeWidth={1.75} color="currentColor" />
          </div>
          <div className="brand-title">NorskLive Pro</div>
        </div>

        <div className="top-controls">
          {onToggleMaterials && (
            <button
              type="button"
              id="materialsToggleBtn"
              className={`pill-btn materials-toggle-btn ${materialsOpen ? 'active' : ''}`}
              aria-expanded={materialsOpen}
              aria-controls="materialsDrawer"
              onClick={onToggleMaterials}
            >
              <SlidersHorizontal
                size={20}
                strokeWidth={1.75}
                color="currentColor"
                aria-hidden="true"
              />
              <span>Материалы</span>
            </button>
          )}

          {authEnabled ? (
            <>
              {userEmail ? (
                <span className="brand-badge t-caption" id="userEmailBadge">
                  {userEmail}
                </span>
              ) : null}
              <form method="post" action="/auth/signout">
                <button type="submit" className="pill-btn">
                  Выйти
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      {/* 3 Core Training Modules — Horizontal Segmented Control */}
      <nav
        className="module-tabs segmented-control"
        id="moduleTabs"
        role="tablist"
        aria-label="Модули тренажёра"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentModule === 'norskprove'}
          aria-label="1. Norskprøve Muntlig (HK-dir)"
          title="1. Norskprøve Muntlig (HK-dir)"
          className={`module-tab ${currentModule === 'norskprove' ? 'active' : ''}`}
          data-module="norskprove"
          onClick={() => onSwitchModule('norskprove')}
        >
          <GraduationCap size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Norskprøve</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentModule === 'jobbintervju'}
          aria-label="2. Jobbintervju på norsk"
          title="2. Jobbintervju på norsk"
          className={`module-tab ${currentModule === 'jobbintervju' ? 'active' : ''}`}
          data-module="jobbintervju"
          onClick={() => onSwitchModule('jobbintervju')}
        >
          <Briefcase size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Jobbintervju</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentModule === 'pensum'}
          aria-label="3. CEFR Teleprompter"
          title="3. CEFR Teleprompter"
          className={`module-tab ${currentModule === 'pensum' ? 'active' : ''}`}
          data-module="pensum"
          onClick={() => onSwitchModule('pensum')}
        >
          <BookOpen size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Pensum</span>
        </button>
      </nav>
    </header>
  );
}

export interface CallHeroProps {
  currentModule: ModuleKey;
  currentScenario: Scenario;
  agentPersona?: AgentPersona;
  blurMode?: boolean;
  examPart: number;
  timerSeconds: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  onChangeAgentPersona?: (persona: AgentPersona) => void;
  onToggleBlur?: () => void;
  onAdvanceExamPart: () => void;
  onRestartSession?: () => void;
}

export function CallHero({
  currentModule,
  currentScenario,
  examPart,
  timerSeconds,
  isListening = false,
  isSpeaking = false,
  onAdvanceExamPart
}: CallHeroProps) {
  const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const secs = String(timerSeconds % 60).padStart(2, '0');
  const showExamControls =
    currentModule === 'norskprove' && Boolean(currentScenario.examStructure);

  const examBtnLabel =
    examPart === 1
      ? 'К Этапу 2'
      : examPart === 2
        ? 'К Этапу 3'
        : 'Завершить и скачать вердикт HK-dir';

  const shortSubtitle =
    currentModule === 'norskprove'
      ? examPart === 1
        ? 'Del 1 · Monolog · 2–3 min'
        : examPart === 2
          ? 'Del 2 · Samtale · 5–6 min'
          : 'Del 3 · Oppfølging · Sensor'
      : `${currentScenario.level} · ${currentScenario.partnerRole}`.slice(0, 56);

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
          <div className="partner-avatar" id="partnerAvatar" aria-hidden="true">
            <User size={20} strokeWidth={1.75} color="currentColor" />
          </div>
        </div>
        <div className="partner-info">
          <h2 className="partner-heading" id="partnerName">
            {currentScenario.partnerName}
          </h2>
          <p className="t-caption" id="partnerRole">
            {shortSubtitle}
          </p>
        </div>
      </div>

      <div className="call-toolbar">
        <div className="exam-timer-badge t-caption" id="sessionTimerBadge">
          <Clock size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>{`${mins}:${secs}`}</span>
        </div>

        {showExamControls && (
          <button
            type="button"
            className="btn-text"
            id="examPartBtn"
            onClick={onAdvanceExamPart}
          >
            {examPart < 3 ? (
              <SkipForward size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            )}
            <span>{examBtnLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import {
  CheckCircle2,
  Clock,
  Globe,
  SkipForward,
  User
} from 'lucide-react';
import type { ModuleKey, Scenario } from '../../content/scenarios';
import { DRAFT_SCENARIO_LABEL } from '../../content/scenarios/visibility';
import type { AgentPersona, CefrLevel, L1Language } from './useStudioState';

export interface TopBarProps {
  currentModule?: ModuleKey;
  l1Lang?: L1Language;
  userLevel?: CefrLevel;
  authEnabled?: boolean;
  userEmail?: string | null;
  materialsOpen?: boolean;
  onToggleMaterials?: () => void;
  onSwitchModule?: (module: ModuleKey) => void;
  onChangeL1Lang?: (l1: L1Language) => void;
  onChangeUserLevel?: (level: CefrLevel) => void;
}

export function TopBar({
  authEnabled = false,
  userEmail = null
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
          {currentScenario.status === 'draft' ? (
            <span className="scenario-draft-badge t-caption" data-testid="chatHeaderDraftLabel">
              {DRAFT_SCENARIO_LABEL}
            </span>
          ) : null}
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

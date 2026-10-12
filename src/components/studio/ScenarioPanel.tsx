'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Info,
  User
} from 'lucide-react';
import type { ModuleKey, Scenario, ScenarioTopic } from '../../content/scenarios';
import { DRAFT_SCENARIO_LABEL } from '../../content/scenarios/visibility';
import { VACANCY_MAX_CHARS } from './useStudioState';

export interface ScenarioPanelProps {
  currentModule: ModuleKey;
  scenarios: Scenario[];
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onApplyCustomSource: (rawText: string) => void;
  /** Jobbintervju only: start an interview for a vacancy the learner pasted. */
  onApplyVacancy?: (vacancyText: string) => void;
  targetLevel?: string;
  showDrafts?: boolean;
  children?: ReactNode;
}

const TOPIC_ORDER: ScenarioTopic[] = [
  'arbeid',
  'bolig',
  'helse',
  'familie',
  'handel',
  'transport',
  'fritid'
];

const TOPIC_LABELS: Record<ScenarioTopic, string> = {
  arbeid: 'Arbeid',
  bolig: 'Bolig',
  helse: 'Helse',
  familie: 'Familie',
  handel: 'Handel',
  transport: 'Transport',
  fritid: 'Fritid'
};

export function ScenarioPanel({
  currentModule,
  scenarios,
  currentScenario,
  onSelectScenario,
  onApplyCustomSource,
  onApplyVacancy,
  targetLevel = 'B1',
  showDrafts,
  children
}: ScenarioPanelProps) {
  const [customText, setCustomText] = useState('');
  const [vacancyText, setVacancyText] = useState('');

  const leftPanelTitle =
    currentModule === 'norskprove'
      ? 'Norskprøve Muntlig (HK-dir)'
      : currentModule === 'jobbintervju'
        ? 'Jobbintervju på norsk'
        : 'CEFR Teleprompter';

  const customLoaderTitle =
    currentModule === 'norskprove'
      ? 'Своя экзаменационная тема / список слов'
      : 'Введите 10 своих слов для вывода в речь';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setCustomText(result);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyVacancy = () => {
    const raw = vacancyText.trim();
    if (!raw || !onApplyVacancy) return;
    onApplyVacancy(raw);
  };

  const handleApplyClick = () => {
    const raw = customText.trim();
    if (!raw) return;
    onApplyCustomSource(raw);
    setCustomText('');
  };

  const draftsEnabled =
    showDrafts !== undefined
      ? showDrafts
      : typeof process !== 'undefined' &&
        (process.env.NEXT_PUBLIC_SCENARIOS_SHOW_DRAFTS === 'true' ||
          process.env.SCENARIOS_SHOW_DRAFTS === 'true' ||
          process.env.NODE_ENV !== 'production');

  const filteredScenarios = scenarios.filter((sc) => {
    if (currentModule !== 'norskprove') return true;

    // Remove the B2 scenarios from the default list (keep them under a level: 'B2' filter that is not shown)
    if (targetLevel !== 'B2' && sc.level === 'B2') {
      return false;
    }

    // Filter by learner's target level
    if (sc.level && (sc.level === 'A2' || sc.level === 'B1' || sc.level === 'B2')) {
      if (sc.level !== targetLevel) return false;
    }

    // Production hides drafts; draftsEnabled shows them
    if (!draftsEnabled && sc.status === 'draft') {
      return false;
    }

    return true;
  });

  const renderScenarioItem = (sc: Scenario) => (
    <div
      key={sc.id}
      className={`scenario-item ${currentScenario.id === sc.id ? 'active' : ''}`}
      onClick={() => onSelectScenario(sc)}
    >
      <div className="scenario-top">
        <span className="scenario-badge t-caption">{sc.badge}</span>
        <span className="scenario-level t-caption">{sc.level}</span>
      </div>
      <div className="scenario-name">
        <User size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
        <span>{sc.title}</span>
      </div>
      <div className="scenario-desc t-caption">{sc.description}</div>
      {sc.status === 'draft' ? (
        <div className="scenario-draft-badge t-caption" data-testid="scenarioDraftLabel">
          {DRAFT_SCENARIO_LABEL}
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-title" id="leftPanelTitle">
          {currentModule === 'norskprove' ? (
            <GraduationCap size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          ) : currentModule === 'jobbintervju' ? (
            <Briefcase size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          ) : (
            <BookOpen size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          )}
          <span>{leftPanelTitle}</span>
        </div>
        <span className="scenario-badge t-caption" id="scenarioCountBadge">
          {`${filteredScenarios.length} сценария`}
        </span>
      </div>

      <div className="panel-body">
        {/* Legal Compliance / UDI Context Banner — single line of .t-caption */}
        <p className="compliance-notice t-caption" id="complianceNotice">
          <Info size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          {currentModule === 'norskprove' && (
            <span>
              <strong>UDI (01.09.2025):</strong> Устный Norskprøve (A2/B1) — симуляция Sensor +
              Medkandidat.
            </span>
          )}
          {currentModule === 'jobbintervju' && (
            <span>
              <strong>Собеседование:</strong> Тренировка ответов на частые вопросы работодателя.
            </span>
          )}
          {currentModule === 'pensum' && (
            <span>
              <strong>Åndsverkloven &amp; Kopinor Safe:</strong> Авторские модули CEFR и телесуфлёр
              на 10 слов.
            </span>
          )}
        </p>

        {/* Scenarios list */}
        <div className="scenario-list" id="scenarioList">
          {currentModule === 'norskprove' ? (
            <>
              {TOPIC_ORDER.map((topic) => {
                const topicItems = filteredScenarios.filter((sc) => sc.topic === topic);
                if (topicItems.length === 0) return null;
                return (
                  <div key={topic} className="scenario-topic-group">
                    <div className="scenario-topic-title t-caption">
                      {TOPIC_LABELS[topic] || topic}
                    </div>
                    {topicItems.map(renderScenarioItem)}
                  </div>
                );
              })}
              {filteredScenarios
                .filter((sc) => !sc.topic)
                .map(renderScenarioItem)}
            </>
          ) : (
            filteredScenarios.map(renderScenarioItem)
          )}
        </div>

        {currentModule === 'jobbintervju' ? (
          <div className="custom-loader-box" id="vacancyBox">
            <label className="custom-loader-heading t-caption" htmlFor="vacancyTextarea">
              <FileText size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>Вставьте текст вакансии (по желанию)</span>
            </label>
            <textarea
              id="vacancyTextarea"
              className="custom-textarea"
              maxLength={VACANCY_MAX_CHARS}
              aria-describedby="vacancyPrivacyNote"
              placeholder="Например: Vi søker en blid og pålitelig medarbeider til butikken vår…"
              value={vacancyText}
              onChange={(e) => setVacancyText(e.target.value)}
            />
            <div className="vacancy-meta t-caption">
              <p id="vacancyPrivacyNote">
                Текст не сохраняется: он отправляется ИИ только вместе с вашими ответами в этом
                интервью.
              </p>
              <span className="vacancy-count">{`${vacancyText.length} / ${VACANCY_MAX_CHARS}`}</span>
            </div>
            <button
              type="button"
              id="applyVacancyBtn"
              className="btn-outline btn-block"
              onClick={handleApplyVacancy}
              disabled={!vacancyText.trim()}
            >
              <Briefcase size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>Начать интервью по этой вакансии</span>
            </button>
          </div>
        ) : null}

        {/* Custom text loader for norskprove & pensum */}
        {currentModule !== 'jobbintervju' ? (
          <div className="custom-loader-box" id="customLoaderBox">
            <span className="custom-loader-heading t-caption">{customLoaderTitle}</span>
            <textarea
              id="customSourceTextarea"
              className="custom-textarea"
              placeholder={
                currentModule === 'norskprove'
                  ? 'Вставьте текст темы, вопросы или заметки...'
                  : 'Введите 10 слов через запятую или пробел...'
              }
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <div className="custom-loader-actions">
              <label className="btn-outline file-upload-label" htmlFor="customFileInput">
                <span>Загрузить .txt</span>
                <input
                  id="customFileInput"
                  type="file"
                  accept=".txt,.md"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                id="applyCustomSourceBtn"
                className="btn-outline custom-apply-btn"
                onClick={handleApplyClick}
              >
                <span>Применить</span>
              </button>
            </div>
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}

'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Info,
  PlusCircle,
  Sparkles,
  User
} from 'lucide-react';
import type { ModuleKey, Scenario } from '../../content/scenarios';
import { VACANCY_MAX_CHARS } from './useStudioState';

export interface ScenarioPanelProps {
  currentModule: ModuleKey;
  scenarios: Scenario[];
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onApplyCustomSource: (rawText: string) => void;
  /** Jobbintervju only: start an interview for a vacancy the learner pasted. */
  onApplyVacancy?: (vacancyText: string) => void;
  children?: ReactNode;
}

export function ScenarioPanel({
  currentModule,
  scenarios,
  currentScenario,
  onSelectScenario,
  onApplyCustomSource,
  onApplyVacancy,
  children
}: ScenarioPanelProps) {
  const [customText, setCustomText] = useState('');
  const [vacancyText, setVacancyText] = useState('');

  const leftPanelTitle =
    currentModule === 'norskprove'
      ? '1. Norskprøve Muntlig (HK-dir)'
      : currentModule === 'jobbintervju'
        ? '2. Jobbintervju på norsk'
        : '3. CEFR Teleprompter';

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
          {`${scenarios.length} сценария`}
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
          {scenarios.map((sc) => (
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
            </div>
          ))}
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
        ) : (
          <div className="custom-loader-box">
            <div className="custom-loader-title">
              <span className="custom-loader-heading t-caption" id="customLoaderTitle">
                <PlusCircle size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>{customLoaderTitle}</span>
              </span>
              <label className="file-upload-label t-caption">
                <FileText size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>Загрузить .txt/.md</span>
                <input
                  type="file"
                  id="fileUploadInput"
                  accept=".txt,.md,.csv"
                  className="sr-only-input"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <textarea
              id="customSourceTextarea"
              className="custom-textarea"
              placeholder="Вставьте свой текст или введите до 10 новых норвежских слов через запятую..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <button
              type="button"
              id="applyCustomSourceBtn"
              className="btn-outline btn-block"
              onClick={handleApplyClick}
            >
              <Sparkles size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>Сгенерировать ролевой спарринг и телесуфлёр</span>
            </button>
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

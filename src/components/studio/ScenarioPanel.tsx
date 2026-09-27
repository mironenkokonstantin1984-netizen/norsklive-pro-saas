'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import type { ModuleKey, Scenario } from '../../content/scenarios';

export interface ScenarioPanelProps {
  currentModule: ModuleKey;
  scenarios: Scenario[];
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onApplyCustomSource: (rawText: string) => void;
  children?: ReactNode;
}

export function ScenarioPanel({
  currentModule,
  scenarios,
  currentScenario,
  onSelectScenario,
  onApplyCustomSource,
  children
}: ScenarioPanelProps) {
  const [customText, setCustomText] = useState('');

  const leftPanelTitle =
    currentModule === 'norskprove'
      ? '🎓 1. Norskprøve Muntlig (HK-dir)'
      : currentModule === 'jobbintervju'
        ? '💼 2. Jobbintervju på norsk'
        : '🛡️ 3. CEFR Teleprompter';

  const customLoaderTitle =
    currentModule === 'norskprove'
      ? '➕ Своя экзаменационная тема / список слов'
      : currentModule === 'jobbintervju'
        ? '➕ Вставьте текст вакансии и вашего CV'
        : '➕ Введите 10 своих слов для вывода в речь';

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
          {leftPanelTitle}
        </div>
        <span className="scenario-badge" id="scenarioCountBadge">
          {`${scenarios.length} сценария`}
        </span>
      </div>

      <div className="panel-body">
        {/* Legal Compliance / UDI Context Banner */}
        <div
          id="complianceNotice"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '9px',
            padding: '8px 10px',
            fontSize: '0.73rem',
            color: '#6ee7b7'
          }}
        >
          {currentModule === 'norskprove' && (
            <>
              🏛️ <strong>Закон UDI (с 01.09.2025):</strong> Для получения ПМЖ обязательна сдача
              устного экзамена Norskprøve (A2/B1). Мультиагентная симуляция (Sensor +
              Medkandidat).
            </>
          )}
          {currentModule === 'jobbintervju' && (
            <>
              👔 <strong>CV + Вакансия &amp; Cultural Fit:</strong> Анализ разрыва между твоим CV
              и вакансией + адаптация ответов под норвежский командный стиль (lagspiller &amp;
              lunsjprat).
            </>
          )}
          {currentModule === 'pensum' && (
            <>
              🛡️ <strong>Åndsverkloven &amp; Kopinor 2026–2027 Safe:</strong> 100% проприетарные
              модули CEFR + телесуфлёр на 10 твоих слов.
            </>
          )}
        </div>

        {/* Scenarios list */}
        <div className="scenario-list" id="scenarioList">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className={`scenario-item ${currentScenario.id === sc.id ? 'active' : ''}`}
              onClick={() => onSelectScenario(sc)}
            >
              <div className="scenario-top">
                <span className="scenario-badge">{sc.badge}</span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                  {sc.level}
                </span>
              </div>
              <div className="scenario-name">{`${sc.avatar} ${sc.title}`}</div>
              <div className="scenario-desc">{sc.description}</div>
            </div>
          ))}
        </div>

        {/* Custom 10-Word Generator / Paste Job Ad & CV Input */}
        <div className="custom-loader-box">
          <div className="custom-loader-title">
            <span id="customLoaderTitle">{customLoaderTitle}</span>
            <label
              style={{
                cursor: 'pointer',
                fontSize: '0.72rem',
                color: '#93c5fd',
                textDecoration: 'underline'
              }}
            >
              📄 Загрузить .txt/.md
              <input
                type="file"
                id="fileUploadInput"
                accept=".txt,.md,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
          </div>
          <textarea
            id="customSourceTextarea"
            className="custom-textarea"
            placeholder="Вставьте текст вакансии и вашего CV или введите до 10 новых норвежских слов через запятую..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
          />
          <button
            type="button"
            id="applyCustomSourceBtn"
            className="btn-primary-sm"
            onClick={handleApplyClick}
          >
            🚀 Сгенерировать ролевой спарринг и телесуфлёр
          </button>
        </div>

        {children}
      </div>
    </section>
  );
}

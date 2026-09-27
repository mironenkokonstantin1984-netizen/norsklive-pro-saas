'use client';

import { speakNorwegian } from '../../lib/speech';
import type { GlossaryItem } from './useStudioState';

export interface GlossaryPanelProps {
  savedGlossary: GlossaryItem[];
  usedWordsCount: number;
  totalTargetWords: number;
  onExportReport: () => void;
}

export function GlossaryPanel({
  savedGlossary,
  usedWordsCount,
  totalTargetWords,
  onExportReport
}: GlossaryPanelProps) {
  const pct =
    totalTargetWords > 0 ? Math.round((usedWordsCount / totalTargetWords) * 100) : 0;

  return (
    <section className="panel right-panel">
      <div className="panel-header">
        <div className="panel-title">🧠 HK-dir Матрица &amp; L1 Микро-коррекция</div>
        <button
          type="button"
          id="generateReportBtn"
          className="mini-action-btn"
          style={{
            background: 'rgba(16,185,129,0.2)',
            color: '#34d399',
            fontWeight: 700
          }}
          onClick={onExportReport}
        >
          📊 Отчёт HK-dir / Notion
        </button>
      </div>

      <div className="panel-body">
        {/* HK-dir Official 4-Criteria Live Estimator */}
        <div className="hkdir-box">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}
          >
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#c7d2fe' }}>
              🏛️ 4 Критерия HK-dir (Официальная шкала)
            </span>
            <span className="hkdir-pill" id="overallCefrBadge">
              Уровень: B1+
            </span>
          </div>
          <div className="hkdir-score-row">
            <span>1. Uttale &amp; Tonelag (L2 Акцент)</span>
            <strong id="scoreFlyt" style={{ color: '#38bdf8' }}>
              B1+ (Tydelig)
            </strong>
          </div>
          <div className="hkdir-score-row">
            <span>2. Ordforråd (Активный словарь)</span>
            <strong id="scoreOrd" style={{ color: '#34d399' }}>
              {`${usedWordsCount} av ${totalTargetWords} målord (${pct}%)`}
            </strong>
          </div>
          <div className="hkdir-score-row">
            <span>3. Grammatikk (V2-инверсия)</span>
            <strong id="scoreGram" style={{ color: '#fbbf24' }}>
              Ожидание реплики...
            </strong>
          </div>
          <div className="hkdir-score-row" style={{ marginBottom: 0 }}>
            <span>4. Samhandling &amp; Norsk Kultur</span>
            <strong id="scoreArg" style={{ color: '#a5b4fc' }}>
              Инициатива в диалоге
            </strong>
          </div>
        </div>

        {/* Latest Live Correction Cards (A2 -> B2 + L1 Explanation + Cultural Fit) */}
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: '#94a3b8'
            }}
          >
            ⚡ Трансформация фраз (A2 → B2) + L1 Разбор + Cultural Fit
          </div>
          <div
            id="coachingCardsList"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <div className="coaching-card">
              <div className="coaching-row">
                <span className="coaching-tag tag-better">
                  Пример трансформации (A2 → B2 Løft)
                </span>
                <div style={{ marginTop: '4px', color: '#cbd5e1', fontSize: '0.79rem' }}>
                  🔴 <strong>A2:</strong> «Jeg tenker at miljø er viktig»
                  <br />
                  🟢 <strong>B2:</strong> «Det er avgjørende å ta hensyn til miljøet for å
                  sikre en bærekraftig velferdsstat.»
                  <br />
                  🤝 <strong>Samhandling / Janteloven:</strong> Вместо «Я сделал всё сам» →
                  «Vi oppnådde dette gjennom tett samarbeid og medvirkning i teamet».
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Personal Glossary (Min Ordbok) + Export */}
        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              📌 Min Ordbok (<span id="savedWordsCount">{savedGlossary.length}</span>)
            </span>
            <button
              type="button"
              id="exportGlossaryBtn"
              className="mini-action-btn"
              onClick={onExportReport}
            >
              ⬇️ Скачать отчёт (.md)
            </button>
          </div>
          <div
            id="savedGlossaryList"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '95px',
              overflowY: 'auto'
            }}
          >
            {savedGlossary.map((item) => (
              <span
                key={item.word}
                className="scenario-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => speakNorwegian(item.example || item.word)}
              >
                {`📌 ${item.word}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

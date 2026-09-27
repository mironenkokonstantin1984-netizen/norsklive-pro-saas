'use client';

import type { Correction } from '../../server/schemas';
import { CoachingPanel } from './CoachingPanel';
import {
  DEFAULT_HKDIR_SCORES,
  type GlossaryItem,
  type HkdirScores,
  type L1Language
} from './useStudioState';

export interface GlossaryPanelProps {
  savedGlossary: GlossaryItem[];
  usedWordsCount: number;
  totalTargetWords: number;
  coachingHistory?: Correction[];
  hkdirScores?: HkdirScores;
  l1Lang?: L1Language;
  onSpeak: (text: string) => void;
  onSaveToGlossary: (word: string, translation: string, example?: string) => void;
  onExportReport: () => void;
}

export function GlossaryPanel({
  savedGlossary,
  usedWordsCount,
  totalTargetWords,
  coachingHistory = [],
  hkdirScores = DEFAULT_HKDIR_SCORES,
  l1Lang = 'ru',
  onSpeak,
  onSaveToGlossary,
  onExportReport
}: GlossaryPanelProps) {
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
        <CoachingPanel
          coachingHistory={coachingHistory}
          hkdirScores={hkdirScores}
          usedWordsCount={usedWordsCount}
          totalTargetWords={totalTargetWords}
          l1Lang={l1Lang}
          onSpeak={onSpeak}
          onSaveToGlossary={onSaveToGlossary}
        />

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
                onClick={() => onSpeak(item.example || item.word)}
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

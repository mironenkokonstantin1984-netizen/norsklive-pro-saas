'use client';

import { Bookmark, Download, FileText, GraduationCap } from 'lucide-react';
import type { CoachFeedback, Correction } from '../../server/schemas';
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
  coachingHistory?: Array<CoachFeedback | Correction>;
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
        <div className="panel-title">
          <GraduationCap size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>HK-dir Матрица &amp; L1 Микро-коррекция</span>
        </div>
        <button
          type="button"
          id="generateReportBtn"
          className="mini-action-btn"
          onClick={onExportReport}
        >
          <FileText size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Отчёт HK-dir / Notion</span>
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
        <div className="glossary-footer">
          <div className="glossary-footer-header">
            <span className="panel-title t-caption">
              <Bookmark size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>
                Min Ordbok (<span id="savedWordsCount">{savedGlossary.length}</span>)
              </span>
            </span>
            <button
              type="button"
              id="exportGlossaryBtn"
              className="mini-action-btn"
              onClick={onExportReport}
            >
              <Download size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              <span>Скачать отчёт (.md)</span>
            </button>
          </div>
          <div id="savedGlossaryList" className="saved-glossary-list">
            {savedGlossary.map((item) => (
              <button
                type="button"
                key={item.word}
                className="scenario-badge saved-glossary-chip t-caption"
                onClick={() => onSpeak(item.example || item.word)}
              >
                <Bookmark size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>{item.word}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

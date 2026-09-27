'use client';

import type { TargetWord } from '../../content/scenarios';
import { speakNorwegian } from '../../lib/speech';
import { getL1Text, type L1Language } from './useStudioState';

export interface TargetWordsPanelProps {
  targetWords: TargetWord[];
  usedWords: string[];
  l1Lang: L1Language;
  onSaveToGlossary: (word: string, translation: string, example?: string) => void;
}

export function TargetWordsPanel({
  targetWords,
  usedWords,
  l1Lang,
  onSaveToGlossary
}: TargetWordsPanelProps) {
  const usedSet = new Set((usedWords || []).map((w) => w.toLowerCase()));
  const usedCount = usedSet.size;
  const total = targetWords.length;
  const pct = total > 0 ? Math.round((usedCount / total) * 100) : 0;

  return (
    <div>
      <div className="vocab-progress-head">
        <span>🎯 Активный вывод в речь (Bingo)</span>
        <span id="vocabProgressText" style={{ color: '#34d399' }}>
          {`${usedCount} / ${total} brukt (${pct}%)`}
        </span>
      </div>
      <div className="vocab-bar-bg">
        <div
          className="vocab-bar-fill"
          id="vocabProgressBar"
          style={{ width: `${pct}%` }}
        ></div>
      </div>
      <div className="vocab-grid" id="vocabBingoList">
        {targetWords.map((item) => {
          const isUsed = usedSet.has(item.word.toLowerCase());
          const l1Meaning = getL1Text(item, l1Lang, 'translation');
          return (
            <div
              key={item.word}
              className={`vocab-chip ${isUsed ? 'used' : ''}`}
              onClick={() => {
                speakNorwegian(item.example || item.word);
                onSaveToGlossary(item.word, l1Meaning, item.example);
              }}
            >
              <div className="vocab-chip-top">
                <span className="vocab-word">{`🔊 ${item.word}`}</span>
                <span className="vocab-status">{isUsed ? '✓ BRUKT I TALE' : 'ЦЕЛЬ'}</span>
              </div>
              <div className="vocab-ru">{l1Meaning}</div>
              <div className="vocab-ex">{`«${item.example}»`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

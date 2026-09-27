'use client';

import { CheckCircle2, Circle, Target } from 'lucide-react';
import type { TargetWord } from '../../content/scenarios';
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
  const total = targetWords.length || 1;
  const pct = Math.round((usedWords.length / total) * 100);

  return (
    <div className="vocab-bingo-section">
      <div className="vocab-bingo-header">
        <span className="panel-title">
          <Target size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Активный словарь (Bingo 10 слов)</span>
        </span>
        <span className="scenario-badge t-caption" id="vocabProgressText">
          {`${usedWords.length} / ${targetWords.length} brukt (${pct}%)`}
        </span>
      </div>
      <div className="vocab-progress-bar">
        <div
          className="vocab-progress-fill"
          id="vocabProgressFill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="vocab-helper-note t-caption">
        Произнеси слово в микрофон — оно загорится автоматически:
      </div>
      <div className="vocab-bingo-grid" id="vocabBingoList">
        {targetWords.map((item) => {
          const isUsed = usedWords.includes(item.word.toLowerCase());
          const translation = getL1Text(item, l1Lang, 'ru');

          return (
            <div
              key={item.word}
              className={`vocab-chip ${isUsed ? 'used' : ''}`}
              title={`Пример: ${item.example}`}
              onClick={() => onSaveToGlossary(item.word, translation, item.example)}
            >
              <span className="vocab-word">
                {isUsed ? (
                  <CheckCircle2
                    size={20}
                    strokeWidth={1.75}
                    color="currentColor"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    size={20}
                    strokeWidth={1.75}
                    color="currentColor"
                    aria-hidden="true"
                  />
                )}
                <span>{item.word}</span>
              </span>
              <span className="vocab-ru t-caption">
                {isUsed ? '✓ BRUKT I TALE' : translation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

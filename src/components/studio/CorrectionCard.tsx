'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import type { Correction } from '../../server/schemas';
import { wordDiff } from '../../lib/wordDiff';

export interface CorrectionCardProps {
  correction: Correction;
  olderCorrections?: Correction[];
  l1Explanation?: string;
  /** Exam mode hides the «Попробуйте» phrase. */
  showTry?: boolean;
  onSpeak: (text: string) => void;
}

function renderDiffInline(original: string, corrected: string) {
  const parts = wordDiff(original, corrected);
  return parts.map((part, idx) => {
    const prefix = idx > 0 ? ' ' : '';
    if (part.type === 'del') {
      return (
        <span key={`${idx}-del`}>
          {prefix}
          <del className="correction-del">{part.text}</del>
        </span>
      );
    }
    if (part.type === 'ins') {
      return (
        <span key={`${idx}-ins`}>
          {prefix}
          <ins className="correction-ins">{part.text}</ins>
        </span>
      );
    }
    return (
      <span key={`${idx}-same`}>
        {prefix}
        {part.text}
      </span>
    );
  });
}

export function CorrectionCard({
  correction,
  olderCorrections = [],
  l1Explanation,
  showTry = true,
  onSpeak
}: CorrectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="correction-card" id="latestCorrectionCard" aria-label="Разбор ответа">
      <div className="correction-meta t-caption">
        {correction.cefr_estimate || 'B1'}
      </div>

      <div className="correction-utterance t-speech" lang="nb">
        {renderDiffInline(correction.original, correction.natural_bokmal)}
      </div>

      <div className="correction-rule t-callout">{correction.grammar_rule_l1}</div>

      {l1Explanation ? (
        <div className="correction-l1-explanation t-body">{l1Explanation}</div>
      ) : null}

      {showTry ? (
        <div className="correction-try" data-testid="correctionTry">
          <div className="correction-try-line t-body">
            <span className="correction-try-label t-callout">Попробуйте:</span>{' '}
            <span className="correction-try-phrase" lang="nb">
              {correction.b2_upgrade}
            </span>
          </div>
          <button
            type="button"
            className="btn-text correction-listen-btn"
            onClick={() => onSpeak(correction.b2_upgrade)}
          >
            <Volume2 size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            <span>Прослушать</span>
          </button>
        </div>
      ) : null}

      {olderCorrections.length > 0 && (
        <div className="correction-older-wrap">
          <button
            type="button"
            className="btn-text correction-older-btn"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? (
              <ChevronUp
                size={20}
                strokeWidth={1.75}
                color="currentColor"
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                size={20}
                strokeWidth={1.75}
                color="currentColor"
                aria-hidden="true"
              />
            )}
            <span>{`Предыдущие замечания (${olderCorrections.length})`}</span>
          </button>

          {expanded && (
            <div className="correction-older-list">
              {olderCorrections.map((old, idx) => (
                <div key={`${idx}-${old.original}`} className="correction-older-item">
                  <div className="correction-meta t-caption">
                    {old.cefr_estimate || 'B1'}
                  </div>
                  <div className="correction-utterance t-speech" lang="nb">
                    {renderDiffInline(old.original, old.natural_bokmal)}
                  </div>
                  <div className="correction-rule t-callout">{old.grammar_rule_l1}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import type { CoachFeedback, Correction } from '../../server/schemas';
import { wordDiff } from '../../lib/wordDiff';

export interface CorrectionCardProps {
  feedback?: CoachFeedback;
  correction?: Correction;
  olderCorrections?: Array<CoachFeedback | Correction>;
  l1Explanation?: string;
  /** Exam mode hides the «Попробуйте» / «Как сказать лучше» phrase and hints. */
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

function toFeedback(c: Correction): CoachFeedback {
  const hasDiff = c.original.trim() !== c.natural_bokmal.trim();
  return {
    status: hasDiff ? 'has_errors' : 'ok',
    errors: hasDiff
      ? [
          {
            quote: c.original,
            fix: c.natural_bokmal,
            type: 'other',
            rule_name_l1: c.grammar_rule_l1,
            explanation_l1: c.grammar_rule_l1
          }
        ]
      : [],
    praise_l1: 'Отличная фраза!',
    level_estimate:
      c.cefr_estimate === 'A2' || c.cefr_estimate === 'B1' || c.cefr_estimate === 'B2'
        ? c.cefr_estimate
        : 'B1',
    better_version: c.b2_upgrade
  };
}

export function CorrectionCard({
  feedback,
  correction,
  olderCorrections = [],
  l1Explanation,
  showTry = true,
  onSpeak
}: CorrectionCardProps) {
  const [expandedOlder, setExpandedOlder] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState(false);
  const [expandedMore, setExpandedMore] = useState(false);
  const [expandedBetter, setExpandedBetter] = useState(false);

  // If only legacy correction is passed (e.g. from existing legacy tests)
  if (correction && !feedback) {
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
              aria-expanded={expandedOlder}
              onClick={() => setExpandedOlder((prev) => !prev)}
            >
              {expandedOlder ? (
                <ChevronUp size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              ) : (
                <ChevronDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
              )}
              <span>{`Предыдущие замечания (${olderCorrections.length})`}</span>
            </button>

            {expandedOlder && (
              <div className="correction-older-list">
                {olderCorrections.map((old, idx) => {
                  const legacyOld = 'original' in old ? (old as Correction) : null;
                  if (!legacyOld) return null;
                  return (
                    <div key={`${idx}-${legacyOld.original}`} className="correction-older-item">
                      <div className="correction-meta t-caption">
                        {legacyOld.cefr_estimate || 'B1'}
                      </div>
                      <div className="correction-utterance t-speech" lang="nb">
                        {renderDiffInline(legacyOld.original, legacyOld.natural_bokmal)}
                      </div>
                      <div className="correction-rule t-callout">{legacyOld.grammar_rule_l1}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  const fb = feedback || (correction ? toFeedback(correction) : null);
  if (!fb) return null;

  const hasErrors = fb.status === 'has_errors' && fb.errors.length > 0;
  const firstError = hasErrors ? fb.errors[0] : null;
  const moreErrors = hasErrors ? fb.errors.slice(1) : [];

  return (
    <article className="correction-card" id="latestCorrectionCard" aria-label="Разбор ответа">
      <div className="correction-meta t-caption">
        <span className="correction-cefr">{fb.level_estimate || 'B1'}</span>
      </div>

      {!hasErrors ? (
        <div className="correction-ok-wrap">
          <div className="correction-rule t-callout" data-testid="correctionOk">
            Хорошо!
          </div>
          <div className="correction-praise t-body">{fb.praise_l1}</div>
        </div>
      ) : (
        <>
          {firstError && (
            <>
              <div className="correction-utterance t-speech" lang="nb">
                <del className="correction-del">{firstError.quote}</del>
                <span className="correction-arrow" aria-hidden="true"> → </span>
                <ins className="correction-ins">{firstError.fix}</ins>
              </div>

              <div className="correction-rule t-callout">{firstError.rule_name_l1}</div>

              {firstError.explanation_l1 && (
                <div className="correction-why-wrap">
                  <button
                    type="button"
                    className="btn-text correction-why-btn"
                    aria-expanded={expandedWhy}
                    onClick={() => setExpandedWhy((prev) => !prev)}
                  >
                    {expandedWhy ? (
                      <ChevronUp size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                    ) : (
                      <ChevronDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                    )}
                    <span>Почему?</span>
                  </button>
                  {expandedWhy && (
                    <div className="correction-explanation t-body" data-testid="correctionExplanation">
                      {firstError.explanation_l1}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {moreErrors.length > 0 && (
            <div className="correction-more-wrap">
              <button
                type="button"
                className="btn-text correction-more-btn"
                aria-expanded={expandedMore}
                onClick={() => setExpandedMore((prev) => !prev)}
              >
                {expandedMore ? (
                  <ChevronUp size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                ) : (
                  <ChevronDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                )}
                <span>{`Ещё ${moreErrors.length}`}</span>
              </button>

              {expandedMore && (
                <div className="correction-extra-list">
                  {moreErrors.map((err, idx) => (
                    <div key={`${idx}-${err.quote}`} className="correction-extra-item">
                      <div className="correction-utterance t-speech" lang="nb">
                        <del className="correction-del">{err.quote}</del>
                        <span className="correction-arrow" aria-hidden="true"> → </span>
                        <ins className="correction-ins">{err.fix}</ins>
                      </div>
                      <div className="correction-rule t-callout">{err.rule_name_l1}</div>
                      <div className="correction-explanation t-body">{err.explanation_l1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {fb.samhandling_l1 && (
        <div className="correction-samhandling t-caption">{fb.samhandling_l1}</div>
      )}

      {showTry && fb.better_version ? (
        <div className="correction-better-wrap">
          <button
            type="button"
            className="btn-text correction-better-btn"
            aria-expanded={expandedBetter}
            onClick={() => setExpandedBetter((prev) => !prev)}
          >
            {expandedBetter ? (
              <ChevronUp size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            ) : (
              <ChevronDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            )}
            <span>Как сказать лучше</span>
          </button>

          {expandedBetter && (
            <div className="correction-try" data-testid="correctionTry">
              <div className="correction-try-line t-body">
                <span className="correction-try-label t-callout">Как сказать лучше:</span>{' '}
                <span className="correction-try-phrase" lang="nb">
                  {fb.better_version}
                </span>
              </div>
              <button
                type="button"
                className="btn-text correction-listen-btn"
                onClick={() => onSpeak(fb.better_version!)}
              >
                <Volume2 size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>Прослушать</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {olderCorrections.length > 0 && (
        <div className="correction-older-wrap">
          <button
            type="button"
            className="btn-text correction-older-btn"
            aria-expanded={expandedOlder}
            onClick={() => setExpandedOlder((prev) => !prev)}
          >
            {expandedOlder ? (
              <ChevronUp size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            ) : (
              <ChevronDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            )}
            <span>{`Предыдущие замечания (${olderCorrections.length})`}</span>
          </button>

          {expandedOlder && (
            <div className="correction-older-list">
              {olderCorrections.map((old, idx) => {
                const oldFb = 'status' in old ? (old as CoachFeedback) : toFeedback(old as Correction);
                const oldHasErrors = oldFb.status === 'has_errors' && oldFb.errors.length > 0;
                return (
                  <div key={`${idx}-${oldFb.praise_l1 || idx}`} className="correction-older-item">
                    <div className="correction-meta t-caption">
                      {oldFb.level_estimate || 'B1'}
                    </div>
                    {oldHasErrors ? (
                      <>
                        <div className="correction-utterance t-speech" lang="nb">
                          <del className="correction-del">{oldFb.errors[0].quote}</del>
                          <span className="correction-arrow" aria-hidden="true"> → </span>
                          <ins className="correction-ins">{oldFb.errors[0].fix}</ins>
                        </div>
                        <div className="correction-rule t-callout">{oldFb.errors[0].rule_name_l1}</div>
                      </>
                    ) : (
                      <div className="correction-rule t-callout">
                        Хорошо! {oldFb.praise_l1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

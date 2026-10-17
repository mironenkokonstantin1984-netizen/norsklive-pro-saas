'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CoachFeedback } from '../../server/schemas';

export interface FeedbackCardProps {
  feedback: CoachFeedback;
  learnerText?: string;
  onNext: () => void;
  onRepeat?: () => void;
  onSpeak: (text: string) => void;
}

function formatMoreErrors(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `Ещё ${count} замечаний`;
  if (mod10 === 1) return `Ещё ${count} замечание`;
  if (mod10 >= 2 && mod10 <= 4) return `Ещё ${count} замечания`;
  return `Ещё ${count} замечаний`;
}

/**
 * Replaces the wrong quote in the learner text with <del>quote</del> <ins>fix</ins>.
 * Returns the elements and the full corrected sentence for TTS.
 */
function buildSentenceDiff(
  fullSentence: string | undefined,
  quote: string,
  fix: string
): { node: React.ReactNode; correctedFull: string } {
  if (!fullSentence || !fullSentence.trim()) {
    return {
      node: (
        <>
          <del className="practice-del">{quote}</del>
          <span className="practice-diff-arrow" aria-hidden="true"> → </span>
          <ins className="practice-ins">{fix}</ins>
        </>
      ),
      correctedFull: fix
    };
  }

  const lowerSentence = fullSentence.toLowerCase();
  const lowerQuote = quote.toLowerCase();
  const idx = lowerSentence.indexOf(lowerQuote);

  if (idx === -1) {
    return {
      node: (
        <>
          <del className="practice-del">{quote}</del>
          <span className="practice-diff-arrow" aria-hidden="true"> → </span>
          <ins className="practice-ins">{fix}</ins>
        </>
      ),
      correctedFull: fix
    };
  }

  const before = fullSentence.slice(0, idx);
  const matchedOriginal = fullSentence.slice(idx, idx + quote.length);
  const after = fullSentence.slice(idx + quote.length);
  const correctedFull = `${before}${fix}${after}`.trim();

  return {
    node: (
      <>
        {before}
        <del className="practice-del">{matchedOriginal}</del>
        {' '}
        <ins className="practice-ins">{fix}</ins>
        {after}
      </>
    ),
    correctedFull
  };
}

export function FeedbackCard({
  feedback,
  learnerText,
  onNext,
  onRepeat,
  onSpeak
}: FeedbackCardProps) {
  const [expandedWhy, setExpandedWhy] = useState(false);
  const [expandedMore, setExpandedMore] = useState(false);
  const [expandedBetter, setExpandedBetter] = useState(false);

  const errorsList = feedback.errors || [];
  const hasErrors = feedback.status === 'has_errors' && errorsList.length > 0;
  const firstError = hasErrors ? errorsList[0] : null;
  const moreErrors = hasErrors ? errorsList.slice(1) : [];

  const mainDiff = useMemo(() => {
    if (!firstError) return null;
    return buildSentenceDiff(learnerText, firstError.quote, firstError.fix);
  }, [learnerText, firstError]);

  const handleListenFix = useCallback(() => {
    if (!firstError) return;
    const toSpeak = mainDiff?.correctedFull || firstError.fix;
    onSpeak(toSpeak);
  }, [firstError, mainDiff, onSpeak]);

  const handleListenBetter = useCallback(() => {
    if (feedback.better_version) {
      onSpeak(feedback.better_version);
    }
  }, [feedback.better_version, onSpeak]);

  return (
    <article
      className="practice-feedback-card"
      id="latestCorrectionCard"
      data-testid="feedbackCard"
      role="region"
      aria-label="Разбор ответа"
    >
      {/* STATUS: OK (no errors) */}
      {!hasErrors ? (
        <div className="practice-feedback-ok" data-testid="feedbackOk">
          <div className="practice-feedback-header">
            <CheckCircle2
              size={22}
              className="practice-feedback-icon-ok"
              aria-hidden="true"
            />
            <span className="practice-feedback-title t-callout">Хорошо!</span>
          </div>
          <p className="practice-feedback-praise t-body">{feedback.praise_l1}</p>
          <div className="practice-feedback-actions">
            <button
              type="button"
              className="practice-filled-btn t-callout"
              onClick={onNext}
              aria-label="Дальше"
            >
              Дальше
            </button>
          </div>
        </div>
      ) : (
        /* STATUS: HAS ERRORS */
        <div className="practice-feedback-errors" data-testid="feedbackErrors">
          <div className="practice-feedback-header">
            <AlertCircle
              size={22}
              className="practice-feedback-icon-error"
              aria-hidden="true"
            />
            <span className="practice-feedback-title t-callout">Разбор ответа</span>
          </div>

          {/* MAIN ERROR */}
          {firstError && mainDiff && (
            <div className="practice-feedback-main-error">
              <div className="practice-feedback-sentence t-speech" lang="nb">
                {mainDiff.node}
              </div>

              <div className="practice-feedback-rule-row">
                <span className="practice-feedback-rule t-callout">
                  {firstError.rule_name_l1}
                </span>

                <button
                  type="button"
                  className="practice-listen-btn t-caption"
                  onClick={handleListenFix}
                  aria-label="Слушать исправление"
                >
                  <Volume2 size={18} aria-hidden="true" />
                  <span>Слушать</span>
                </button>
              </div>

              {/* «Почему?» explanation accordion */}
              {firstError.explanation_l1 && (
                <div className="practice-feedback-why-wrap">
                  <button
                    type="button"
                    className="practice-accordion-btn t-callout"
                    aria-expanded={expandedWhy}
                    onClick={() => setExpandedWhy((prev) => !prev)}
                  >
                    <span>Почему?</span>
                    {expandedWhy ? (
                      <ChevronUp size={18} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={18} aria-hidden="true" />
                    )}
                  </button>
                  {expandedWhy && (
                    <div
                      className="practice-feedback-explanation t-body"
                      data-testid="feedbackExplanation"
                    >
                      {firstError.explanation_l1}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* «Ещё N замечания» accordion */}
          {moreErrors.length > 0 && (
            <div className="practice-feedback-more-wrap">
              <button
                type="button"
                className="practice-accordion-btn t-callout"
                aria-expanded={expandedMore}
                onClick={() => setExpandedMore((prev) => !prev)}
              >
                <span>{formatMoreErrors(moreErrors.length)}</span>
                {expandedMore ? (
                  <ChevronUp size={18} aria-hidden="true" />
                ) : (
                  <ChevronDown size={18} aria-hidden="true" />
                )}
              </button>

              {expandedMore && (
                <div
                  className="practice-feedback-more-list"
                  data-testid="feedbackMoreList"
                >
                  {moreErrors.map((err, idx) => (
                    <div key={`${idx}-${err.quote}`} className="practice-feedback-more-item">
                      <div className="practice-feedback-sentence t-speech" lang="nb">
                        <del className="practice-del">{err.quote}</del>
                        <span className="practice-diff-arrow" aria-hidden="true"> → </span>
                        <ins className="practice-ins">{err.fix}</ins>
                      </div>
                      <div className="practice-feedback-rule t-callout">{err.rule_name_l1}</div>
                      <div className="practice-feedback-explanation t-body">{err.explanation_l1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* «Как сказать лучше» accordion */}
          {feedback.better_version && (
            <div className="practice-feedback-better-wrap">
              <button
                type="button"
                className="practice-accordion-btn t-callout"
                aria-expanded={expandedBetter}
                onClick={() => setExpandedBetter((prev) => !prev)}
              >
                <span>Как сказать лучше</span>
                {expandedBetter ? (
                  <ChevronUp size={18} aria-hidden="true" />
                ) : (
                  <ChevronDown size={18} aria-hidden="true" />
                )}
              </button>

              {expandedBetter && (
                <div
                  className="practice-feedback-better-body"
                  data-testid="feedbackBetterBody"
                >
                  <p className="practice-feedback-better-phrase t-speech" lang="nb">
                    {feedback.better_version}
                  </p>
                  <button
                    type="button"
                    className="practice-listen-btn t-caption"
                    onClick={handleListenBetter}
                    aria-label="Слушать лучший вариант"
                  >
                    <Volume2 size={18} aria-hidden="true" />
                    <span>Слушать</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTONS: One filled «Дальше», one outline «Повторить фразу» */}
          <div className="practice-feedback-actions">
            <button
              type="button"
              className="practice-filled-btn t-callout"
              onClick={onNext}
              aria-label="Дальше"
            >
              Дальше
            </button>
            {onRepeat && (
              <button
                type="button"
                className="practice-outline-btn t-callout"
                onClick={onRepeat}
                aria-label="Повторить фразу"
              >
                Повторить фразу
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

'use client';

import {
  AlertCircle,
  Award,
  Bookmark,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  Volume2
} from 'lucide-react';
import type { Correction } from '../../server/schemas';
import type { HkdirScores, L1Language } from './useStudioState';

export interface CoachingPanelProps {
  coachingHistory: Correction[];
  hkdirScores: HkdirScores;
  usedWordsCount: number;
  totalTargetWords: number;
  l1Lang: L1Language;
  onSpeak: (text: string) => void;
  onSaveToGlossary: (word: string, translation: string, example?: string) => void;
}

export function CoachingPanel({
  coachingHistory,
  hkdirScores,
  usedWordsCount,
  totalTargetWords,
  l1Lang,
  onSpeak,
  onSaveToGlossary
}: CoachingPanelProps) {
  const pct =
    totalTargetWords > 0 ? Math.round((usedWordsCount / totalTargetWords) * 100) : 0;

  return (
    <>
      {/* HK-dir Official 4-Criteria Live Estimator */}
      <div className="hkdir-box">
        <div className="hkdir-box-header">
          <span className="panel-title t-caption">
            <Award size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            <span>4 Критерия HK-dir (Официальная шкала)</span>
          </span>
          <span className="hkdir-pill t-caption" id="overallCefrBadge">
            {`Уровень: ${hkdirScores.cefr}`}
          </span>
        </div>
        <div className="hkdir-score-row t-caption">
          <span>1. Uttale &amp; Tonelag (L2 Акцент)</span>
          <strong id="scoreFlyt">B1+ (Tydelig)</strong>
        </div>
        <div className="hkdir-score-row t-caption">
          <span>2. Ordforråd (Активный словарь)</span>
          <strong id="scoreOrd">
            {`${usedWordsCount} av ${totalTargetWords} målord (${pct}%)`}
          </strong>
        </div>
        <div className="hkdir-score-row t-caption">
          <span>3. Grammatikk (V2-инверсия)</span>
          <strong id="scoreGram">{hkdirScores.gram}</strong>
        </div>
        <div className="hkdir-score-row t-caption">
          <span>4. Samhandling &amp; Norsk Kultur</span>
          <strong id="scoreArg">{hkdirScores.arg}</strong>
        </div>
      </div>

      {/* Latest Live Correction Cards (A2 -> B2 + L1 Explanation + Cultural Fit) */}
      <div className="coaching-section">
        <div className="coaching-section-title t-caption">
          <Sparkles size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Трансформация фраз (A2 → B2) + L1 Разбор + Cultural Fit</span>
        </div>
        <div id="coachingCardsList" className="coaching-cards-list">
          {coachingHistory.length === 0 ? (
            <div className="coaching-card">
              <div className="coaching-row">
                <span className="coaching-tag tag-better t-caption">
                  Пример трансформации (A2 → B2 Løft)
                </span>
                <div className="coaching-example-body t-caption">
                  <div className="coaching-example-line">
                    <AlertCircle
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>A2:</strong> «Jeg tenker at miljø er viktig»
                    </span>
                  </div>
                  <div className="coaching-example-line">
                    <CheckCircle2
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>B2:</strong> «Det er avgjørende å ta hensyn til miljøet for å sikre
                      en bærekraftig velferdsstat.»
                    </span>
                  </div>
                  <div className="coaching-example-line">
                    <Users
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>Samhandling / Janteloven:</strong> Вместо «Я сделал всё сам» → «Vi
                      oppnådde dette gjennom tett samarbeid og medvirkning i teamet».
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            coachingHistory.map((corr, idx) => (
              <div key={`${idx}-${corr.original}`} className="coaching-card">
                <div className="coaching-row">
                  <span className="coaching-tag tag-said t-caption">
                    <AlertCircle
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>{`Hva du sa (${corr.cefr_estimate || 'B1'})`}</span>
                  </span>
                  <div className="coaching-text-said">{`«${corr.original}»`}</div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-better t-caption">
                    <CheckCircle2
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>Naturlig Bokmål</span>
                  </span>
                  <div className="coaching-text-better">{`«${corr.natural_bokmal}»`}</div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-b2 t-caption">
                    <TrendingUp
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>B2-Oppgradering (HK-dir / Business Løft)</span>
                  </span>
                  <div className="coaching-text-b2">{`«${corr.b2_upgrade}»`}</div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-rule t-caption">
                    <Lightbulb
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>{`L1 Микро-коррекция (${l1Lang.toUpperCase()}) & Samhandling`}</span>
                  </span>
                  <div className="coaching-text-rule t-caption">{corr.grammar_rule_l1}</div>
                </div>
                <div className="coaching-card-actions">
                  <button
                    type="button"
                    className="mini-action-btn btn-listen-b2"
                    onClick={() => onSpeak(corr.b2_upgrade)}
                  >
                    <Volume2
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>Прослушать B2-фразу</span>
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn btn-save-b2"
                    onClick={() =>
                      onSaveToGlossary(
                        corr.b2_upgrade,
                        corr.grammar_rule_l1,
                        corr.natural_bokmal
                      )
                    }
                  >
                    <Bookmark
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden="true"
                    />
                    <span>В словарь</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

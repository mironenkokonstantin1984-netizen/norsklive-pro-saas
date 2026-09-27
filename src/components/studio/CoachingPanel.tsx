'use client';

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
            {`Уровень: ${hkdirScores.cefr}`}
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
            {hkdirScores.gram}
          </strong>
        </div>
        <div className="hkdir-score-row" style={{ marginBottom: 0 }}>
          <span>4. Samhandling &amp; Norsk Kultur</span>
          <strong id="scoreArg" style={{ color: '#a5b4fc' }}>
            {hkdirScores.arg}
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
          {coachingHistory.length === 0 ? (
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
          ) : (
            coachingHistory.map((corr, idx) => (
              <div key={`${idx}-${corr.original}`} className="coaching-card">
                <div className="coaching-row">
                  <span className="coaching-tag tag-said">
                    {`🔴 Hva du sa (${corr.cefr_estimate || 'B1'})`}
                  </span>
                  <div style={{ color: '#fda4af' }}>{`«${corr.original}»`}</div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-better">🟢 Naturlig Bokmål</span>
                  <div style={{ color: '#6ee7b7', fontWeight: 600 }}>
                    {`«${corr.natural_bokmal}»`}
                  </div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-b2">
                    🚀 B2-Oppgradering (HK-dir / Business Løft)
                  </span>
                  <div style={{ color: '#c7d2fe', fontWeight: 600 }}>
                    {`«${corr.b2_upgrade}»`}
                  </div>
                </div>
                <div className="coaching-row">
                  <span className="coaching-tag tag-rule">
                    {`💡 L1 Микро-коррекция (${l1Lang.toUpperCase()}) & Samhandling`}
                  </span>
                  <div style={{ color: '#fde68a', fontSize: '0.78rem' }}>
                    {corr.grammar_rule_l1}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="mini-action-btn btn-listen-b2"
                    onClick={() => onSpeak(corr.b2_upgrade)}
                  >
                    🔊 Прослушать B2-фразу
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
                    📌 В словарь
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

'use client';

export type ScoreBarLevel = 'A2' | 'B1' | 'B2' | null;

export interface ScoreBarProps {
  label: string;
  level: ScoreBarLevel;
}

/**
 * Maps strings like "B1+", "B1+ / B2", "A2-B1" to the lowest named level ('A2' | 'B1' | 'B2').
 * Unknown strings map to null ("Нет данных").
 */
export function parseCefrLevel(raw: string | null | undefined): ScoreBarLevel {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const matches = raw.match(/\b(A2|B1|B2)\b/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  if (matches.includes('A2')) {
    return 'A2';
  }
  if (matches.includes('B1')) {
    return 'B1';
  }
  if (matches.includes('B2')) {
    return 'B2';
  }
  return null;
}

export function ScoreBar({ label, level }: ScoreBarProps) {
  const valueNow = level === 'A2' ? 1 : level === 'B1' ? 2 : level === 'B2' ? 3 : 0;
  const valueText = level ?? 'Нет данных';
  const fillClass =
    level === 'A2'
      ? 'scorebar-fill-a2'
      : level === 'B1'
        ? 'scorebar-fill-b1'
        : level === 'B2'
          ? 'scorebar-fill-b2'
          : 'scorebar-fill-empty';
  const isBelowB1 = level === null || level === 'A2';

  return (
    <div
      className="scorebar"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={valueNow}
      aria-valuetext={valueText}
    >
      <div className="scorebar-header">
        <span className="scorebar-label t-callout">{label}</span>
        <span
          className={`scorebar-level t-callout ${
            isBelowB1 ? 'scorebar-level-muted' : 'scorebar-level-met'
          }`}
        >
          {valueText}
        </span>
      </div>
      <div className="scorebar-track">
        <div className={`scorebar-fill ${fillClass}`} />
        <span
          className="scorebar-threshold-b1"
          title="Порог B1"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

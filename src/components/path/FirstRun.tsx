'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Nora } from '../companion/Nora';
import {
  writePathPrefs,
  type PathL1,
  type PathPrefs,
  type TargetCefrLevel
} from '../../lib/path/storage';

export interface FirstRunProps {
  initialPrefs: PathPrefs;
  onSkip: (prefs: PathPrefs) => void;
  onFinish: (prefs: PathPrefs) => void;
}

export function FirstRun({ initialPrefs, onSkip, onFinish }: FirstRunProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examDate, setExamDate] = useState<string>(initialPrefs.examDate ?? '');
  const [targetLevel, setTargetLevel] = useState<TargetCefrLevel>(
    initialPrefs.targetLevel ?? 'B1'
  );
  const [l1, setL1] = useState<PathL1>(initialPrefs.l1 ?? 'ru');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleSkip = () => {
    const updated = writePathPrefs({
      onboarded: true,
      targetLevel,
      l1,
      examDate: examDate || undefined
    });
    onSkip(updated);
  };

  const handleStartPractice = () => {
    const updated = writePathPrefs({
      onboarded: true,
      targetLevel,
      l1,
      examDate: examDate || undefined
    });
    onFinish(updated);
    if (typeof window !== 'undefined') {
      try {
        window.location.assign('/studio');
      } catch {
        window.location.href = '/studio';
      }
    }
  };

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const stepTarget = el.querySelector<HTMLElement>(
      '.firstrun-step input:not([disabled]), .firstrun-step button.is-selected:not([disabled]), .firstrun-step button:not([disabled])'
    );
    if (stepTarget) {
      stepTarget.focus();
      return;
    }
    const focusables = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    focusables[0]?.focus();
  }, [step]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleSkip();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleDateInputChange = (value: string) => {
    setExamDate(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      writePathPrefs({ examDate: value });
      setStep(2);
    }
  };

  const handleDateUnknown = () => {
    setExamDate('');
    writePathPrefs({ examDate: undefined });
    setStep(2);
  };

  const handleSelectLevel = (level: TargetCefrLevel) => {
    setTargetLevel(level);
    writePathPrefs({ targetLevel: level });
    setStep(3);
  };

  const handleSelectL1 = (nextL1: PathL1) => {
    setL1(nextL1);
    writePathPrefs({ l1: nextL1 });
  };

  return (
    <div
      className="firstrun-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firstRunQuestionTitle"
      onKeyDown={handleKeyDown}
    >
      <div className="firstrun-sheet" ref={dialogRef}>
        <div className="firstrun-top-row">
          <span className="firstrun-progress t-caption">{`${step} из 3`}</span>
          <button
            type="button"
            className="btn-text firstrun-skip-btn t-callout"
            onClick={handleSkip}
          >
            Пропустить
          </button>
        </div>

        <div className="firstrun-nora">
          <Nora state="idle" size="md" />
        </div>

        {step === 1 ? (
          <div className="firstrun-step">
            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              Когда у вас экзамен?
            </h2>
            <label className="path-exam-field t-caption" htmlFor="firstRunExamDate">
              <span>Дата экзамена</span>
              <input
                id="firstRunExamDate"
                type="date"
                className="path-date-input t-body"
                value={examDate}
                onChange={(e) => handleDateInputChange(e.target.value)}
              />
            </label>
            <div className="firstrun-actions">
              <button
                type="button"
                className="btn-text firstrun-secondary-btn t-callout"
                onClick={handleDateUnknown}
              >
                Пока не знаю
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="firstrun-step">
            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              Какой уровень нужен?
            </h2>
            <div className="firstrun-segmented" role="group" aria-label="Целевой уровень">
              {(['A2', 'B1', 'B2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`firstrun-segment-btn t-callout ${
                    targetLevel === lvl ? 'is-selected' : ''
                  }`}
                  aria-pressed={targetLevel === lvl}
                  onClick={() => handleSelectLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div className="firstrun-actions">
              <button
                type="button"
                className="btn-text firstrun-secondary-btn t-callout"
                onClick={() => handleSelectLevel('B1')}
              >
                Не уверен
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="firstrun-step">
            <h2 id="firstRunQuestionTitle" className="firstrun-title t-title">
              На каком языке объяснять?
            </h2>
            <div className="firstrun-segmented" role="group" aria-label="Язык объяснений">
              {(
                [
                  { code: 'ru', label: 'Русский' },
                  { code: 'uk', label: 'Українська' },
                  { code: 'en', label: 'English' }
                ] as const
              ).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`firstrun-segment-btn t-callout ${
                    l1 === item.code ? 'is-selected' : ''
                  }`}
                  aria-pressed={l1 === item.code}
                  onClick={() => handleSelectL1(item.code)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="firstrun-actions">
              <button
                type="button"
                className="path-primary-link firstrun-primary-btn t-callout"
                onClick={handleStartPractice}
              >
                Начать первую практику
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

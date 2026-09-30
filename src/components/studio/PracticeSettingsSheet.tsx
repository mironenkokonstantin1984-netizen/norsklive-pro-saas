'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ExaminerTempo, PracticePrefs, TextSizeStep } from '../../lib/prefs';

export interface PracticeSettingsSheetProps {
  open: boolean;
  prefs: PracticePrefs;
  onChangePrefs: (next: PracticePrefs) => void;
  onClose: () => void;
}

export function PracticeSettingsSheet({
  open,
  prefs,
  onChangePrefs,
  onClose
}: PracticeSettingsSheetProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeBtnRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const setTextSize = (textSize: TextSizeStep) => {
    onChangePrefs({ ...prefs, textSize });
  };

  const setTempo = (tempo: ExaminerTempo) => {
    onChangePrefs({ ...prefs, tempo });
  };

  const toggleSubtitles = () => {
    onChangePrefs({ ...prefs, subtitles: !prefs.subtitles });
  };

  const toggleContrast = () => {
    onChangePrefs({ ...prefs, contrast: !prefs.contrast });
  };

  const toggleAutoSend = () => {
    onChangePrefs({ ...prefs, autoSend: !prefs.autoSend });
  };

  const toggleExamMode = () => {
    onChangePrefs({ ...prefs, examMode: !prefs.examMode });
  };

  return (
    <div className="comfort-sheet-backdrop" data-testid="comfortSheetScrim" onClick={onClose}>
      <div
        className="comfort-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Удобство"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comfort-sheet-header">
          <h2 className="t-title">Удобство</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn-text"
            aria-label="Закрыть настройки удобства"
            onClick={onClose}
          >
            <X size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            <span>Закрыть</span>
          </button>
        </div>

        <div className="comfort-sheet-body">
          {/* 1. Text size (3 steps segmented control) */}
          <div className="comfort-setting-row">
            <span className="t-callout">Размер текста</span>
            <div
              className="module-tabs segmented-control"
              role="group"
              aria-label="Размер текста"
            >
              <button
                type="button"
                data-size="sm"
                className={`module-tab ${prefs.textSize === 'sm' ? 'active' : ''}`}
                aria-pressed={prefs.textSize === 'sm'}
                onClick={() => setTextSize('sm')}
              >
                Стандартный
              </button>
              <button
                type="button"
                data-size="md"
                className={`module-tab ${prefs.textSize === 'md' ? 'active' : ''}`}
                aria-pressed={prefs.textSize === 'md'}
                onClick={() => setTextSize('md')}
              >
                Крупный
              </button>
              <button
                type="button"
                data-size="lg"
                className={`module-tab ${prefs.textSize === 'lg' ? 'active' : ''}`}
                aria-pressed={prefs.textSize === 'lg'}
                onClick={() => setTextSize('lg')}
              >
                Очень крупный
              </button>
            </div>
          </div>

          {/* 2. Examiner tempo 0.8 / 1.0 */}
          <div className="comfort-setting-row">
            <span className="t-callout">Темп речи экзаменатора</span>
            <div
              className="module-tabs segmented-control"
              role="group"
              aria-label="Темп речи экзаменатора"
            >
              <button
                type="button"
                className={`module-tab ${prefs.tempo === 0.8 ? 'active' : ''}`}
                aria-pressed={prefs.tempo === 0.8}
                onClick={() => setTempo(0.8)}
              >
                0.8
              </button>
              <button
                type="button"
                className={`module-tab ${prefs.tempo === 1.0 ? 'active' : ''}`}
                aria-pressed={prefs.tempo === 1.0}
                onClick={() => setTempo(1.0)}
              >
                1.0
              </button>
            </div>
          </div>

          {/* 3. Examiner subtitles switch */}
          <div className="comfort-setting-row comfort-switch-row">
            <span className="t-callout" id="subtitlesSwitchLabel">
              Субтитры экзаменатора
            </span>
            <button
              type="button"
              role="switch"
              id="subtitlesSwitch"
              aria-labelledby="subtitlesSwitchLabel"
              aria-checked={prefs.subtitles}
              className={`comfort-switch ${prefs.subtitles ? 'is-on' : ''}`}
              onClick={toggleSubtitles}
            >
              <span className="comfort-switch-track" aria-hidden="true">
                <span className="comfort-switch-thumb" />
              </span>
              <span className="t-caption">{prefs.subtitles ? 'Вкл' : 'Выкл'}</span>
            </button>
          </div>

          {/* 4. Increased contrast switch */}
          <div className="comfort-setting-row comfort-switch-row">
            <span className="t-callout" id="contrastSwitchLabel">
              Повышенный контраст
            </span>
            <button
              type="button"
              role="switch"
              id="contrastSwitch"
              aria-labelledby="contrastSwitchLabel"
              aria-checked={prefs.contrast}
              className={`comfort-switch ${prefs.contrast ? 'is-on' : ''}`}
              onClick={toggleContrast}
            >
              <span className="comfort-switch-track" aria-hidden="true">
                <span className="comfort-switch-thumb" />
              </span>
              <span className="t-caption">{prefs.contrast ? 'Вкл' : 'Выкл'}</span>
            </button>
          </div>

          {/* 5. Send right after «Готово» (off: the learner reviews the text first) */}
          <div className="comfort-setting-row comfort-switch-row">
            <span className="t-callout" id="autoSendSwitchLabel">
              Отправлять сразу после «Готово»
            </span>
            <button
              type="button"
              role="switch"
              id="autoSendSwitch"
              aria-labelledby="autoSendSwitchLabel"
              aria-checked={prefs.autoSend}
              className={`comfort-switch ${prefs.autoSend ? 'is-on' : ''}`}
              onClick={toggleAutoSend}
            >
              <span className="comfort-switch-track" aria-hidden="true">
                <span className="comfort-switch-thumb" />
              </span>
              <span className="t-caption">{prefs.autoSend ? 'Вкл' : 'Выкл'}</span>
            </button>
          </div>

          {/* 6. Exam mode: no hints, as in the real exam */}
          <div className="comfort-setting-row comfort-switch-row">
            <span className="t-callout" id="examModeSwitchLabel">
              Режим экзамена (без подсказок)
            </span>
            <button
              type="button"
              role="switch"
              id="examModeSwitch"
              aria-labelledby="examModeSwitchLabel"
              aria-checked={prefs.examMode}
              className={`comfort-switch ${prefs.examMode ? 'is-on' : ''}`}
              onClick={toggleExamMode}
            >
              <span className="comfort-switch-track" aria-hidden="true">
                <span className="comfort-switch-thumb" />
              </span>
              <span className="t-caption">{prefs.examMode ? 'Вкл' : 'Выкл'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

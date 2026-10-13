'use client';

import { useState } from 'react';
import { useNorwegianVoices } from '../../lib/useNorwegianVoices';

export const VOICE_NOTICE_DISMISSED_KEY = 'norsklive_voice_notice_dismissed';

function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(VOICE_NOTICE_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Tells the learner, once per session, that this device cannot speak Norwegian. */
export function VoiceNotice() {
  const { status } = useNorwegianVoices();
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [helpOpen, setHelpOpen] = useState(false);

  if (status !== 'none' || dismissed) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(VOICE_NOTICE_DISMISSED_KEY, '1');
    } catch {
      // Ignore: the notice just comes back next time.
    }
  };

  return (
    <section className="voice-notice" role="status" aria-label="Голос экзаменатора">
      <p className="t-body">
        На этом устройстве нет норвежского голоса. Включите его в настройках устройства или откройте
        Chrome или Edge на компьютере.
      </p>
      {helpOpen && (
        <ul className="voice-notice-help t-callout" id="voiceHelp">
          <li>Android: Настройки, Язык и ввод, Синтез речи, добавьте норвежский (bokmål).</li>
          <li>iPhone: Настройки, Универсальный доступ, Устный контент, Голоса, Norsk.</li>
          <li>Windows: Параметры, Время и язык, Речь, Добавить голоса, Norwegian.</li>
        </ul>
      )}
      <div className="voice-notice-actions">
        <button
          type="button"
          className="btn-outline"
          aria-expanded={helpOpen}
          aria-controls="voiceHelp"
          onClick={() => setHelpOpen((v) => !v)}
        >
          Как включить
        </button>
        <button type="button" className="btn-text" onClick={dismiss}>
          Понятно
        </button>
      </div>
    </section>
  );
}

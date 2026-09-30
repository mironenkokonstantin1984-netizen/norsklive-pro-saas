'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DEFAULT_MIC_STATUS } from '../components/studio/useStudioState';

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionResultItem;
  length: number;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/** Plain messages for the learner. Never show raw browser error codes. */
export const MIC_MESSAGES = {
  notAllowed: 'Нет доступа к микрофону. Разрешите его в настройках браузера или напишите ответ.',
  noSpeech: 'Не слышно речи. Попробуйте ещё раз.',
  audioCapture: 'Микрофон не найден. Проверьте подключение.',
  network: 'Нет связи с сервисом распознавания. Напишите ответ или попробуйте позже.',
  unsupported:
    'В этом браузере нет распознавания речи. Откройте Chrome или Edge либо напишите ответ.',
  tooManyRestarts: 'Запись прервалась. Нажмите «Говорить» ещё раз или напишите ответ.',
  generic: 'Не получилось распознать речь. Попробуйте ещё раз или напишите ответ.'
} as const;

/** Status line while recording; the timer is shown under the mic button. */
export const MIC_RECORDING_HINT = 'Говорите. Нажмите «Готово», когда закончите.';

/** Errors after which the browser will not recover by itself: stop, do not restart. */
const HARD_ERRORS: Record<string, string> = {
  'not-allowed': MIC_MESSAGES.notAllowed,
  'service-not-allowed': MIC_MESSAGES.notAllowed,
  'audio-capture': MIC_MESSAGES.audioCapture,
  network: MIC_MESSAGES.network
};

/** Browsers end a recognition session after a pause or a time limit; we restart it. */
const MAX_QUICK_RESTARTS = 3;
const QUICK_RESTART_WINDOW_MS = 10_000;

export interface UseSpeechRecognitionOptions {
  /** Text already in the answer field; the recording is appended to it. */
  inputText: string;
  /** Called once when recording ends, with the full text to put into the answer field. */
  onTranscriptChange: (transcript: string) => void;
  /** Called when recording ends and `autoSend` is on. */
  onSubmitTranscript: (transcript: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onStatusChange: (statusText: string) => void;
  /** Live text while recording (final and not yet final parts), for display only. */
  onLiveTextChange?: (liveText: string) => void;
  /** The browser has no speech recognition; the learner should type. */
  onUnsupported?: () => void;
  /** Send right after «Готово» instead of letting the learner review the text. */
  autoSend?: boolean;
}

interface RecordingSession {
  active: boolean;
  stopRequested: boolean;
  hardErrorMessage: string | null;
  sawNoSpeech: boolean;
  prefix: string;
  committed: string;
  segmentFinal: string;
  segmentInterim: string;
  restartTimes: number[];
}

function joinText(...parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');
}

function newSession(prefix: string): RecordingSession {
  return {
    active: true,
    stopRequested: false,
    hardErrorMessage: null,
    sawNoSpeech: false,
    prefix,
    committed: '',
    segmentFinal: '',
    segmentInterim: '',
    restartTimes: []
  };
}

export function useSpeechRecognition({
  inputText,
  onTranscriptChange,
  onSubmitTranscript,
  onRecordingChange,
  onSpeakingChange,
  onStatusChange,
  onLiveTextChange,
  onUnsupported,
  autoSend = false
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sessionRef = useRef<RecordingSession | null>(null);
  const latestInputRef = useRef(inputText);

  useEffect(() => {
    latestInputRef.current = inputText;
  }, [inputText]);

  const callbacksRef = useRef({
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange,
    onLiveTextChange,
    onUnsupported,
    autoSend
  });

  useEffect(() => {
    callbacksRef.current = {
      onTranscriptChange,
      onSubmitTranscript,
      onRecordingChange,
      onSpeakingChange,
      onStatusChange,
      onLiveTextChange,
      onUnsupported,
      autoSend
    };
  }, [
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange,
    onLiveTextChange,
    onUnsupported,
    autoSend
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'nb-NO';
    recognition.interimResults = true;
    recognition.continuous = true;

    const currentText = (session: RecordingSession) =>
      joinText(session.prefix, session.committed, session.segmentFinal, session.segmentInterim);

    const finish = (session: RecordingSession) => {
      session.active = false;
      sessionRef.current = null;
      const cb = callbacksRef.current;
      cb.onRecordingChange(false);
      cb.onLiveTextChange?.('');

      const text = currentText(session);
      const spoken = joinText(session.committed, session.segmentFinal, session.segmentInterim);

      if (session.hardErrorMessage) {
        cb.onStatusChange(session.hardErrorMessage);
      } else if (!spoken && session.sawNoSpeech) {
        cb.onStatusChange(MIC_MESSAGES.noSpeech);
      } else {
        cb.onStatusChange(DEFAULT_MIC_STATUS);
      }

      if (!spoken) {
        return;
      }
      if (cb.autoSend && text.length > 1) {
        cb.onTranscriptChange('');
        cb.onSubmitTranscript(text);
      } else {
        cb.onTranscriptChange(text);
      }
    };

    recognition.onstart = () => {
      const session = sessionRef.current;
      if (!session) return;
      const cb = callbacksRef.current;
      cb.onSpeakingChange(false);
      cb.onRecordingChange(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const session = sessionRef.current;
      if (!session) return;
      // With continuous recognition `results` holds every result of this browser session,
      // so rebuild both parts from the start instead of trusting `resultIndex` alone.
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result?.[0]?.transcript ?? '';
        if (result?.isFinal) {
          finalText = joinText(finalText, piece);
        } else {
          interimText = joinText(interimText, piece);
        }
      }
      session.segmentFinal = finalText;
      session.segmentInterim = interimText;
      callbacksRef.current.onLiveTextChange?.(
        joinText(session.committed, session.segmentFinal, session.segmentInterim)
      );
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const session = sessionRef.current;
      if (!session) return;
      const code = event?.error ?? '';
      if (code === 'aborted') return;
      if (code === 'no-speech') {
        session.sawNoSpeech = true;
        return;
      }
      session.hardErrorMessage = HARD_ERRORS[code] ?? MIC_MESSAGES.generic;
    };

    recognition.onend = () => {
      const session = sessionRef.current;
      if (!session || !session.active) return;

      // Keep what this browser session heard before starting the next one.
      const heardSomething = !!joinText(session.segmentFinal, session.segmentInterim);
      session.committed = joinText(session.committed, session.segmentFinal, session.segmentInterim);
      session.segmentFinal = '';
      session.segmentInterim = '';

      if (session.stopRequested || session.hardErrorMessage) {
        finish(session);
        return;
      }

      // The browser stopped on its own (pause, time limit, network hiccup): restart, with a guard.
      // Only sessions that heard nothing count towards the loop guard: some phone browsers end
      // the session after every phrase, and a learner who keeps talking must not be cut off.
      const now = Date.now();
      session.restartTimes = heardSomething
        ? []
        : session.restartTimes.filter((t) => now - t < QUICK_RESTART_WINDOW_MS);
      if (session.restartTimes.length >= MAX_QUICK_RESTARTS) {
        session.hardErrorMessage = MIC_MESSAGES.tooManyRestarts;
        finish(session);
        return;
      }
      session.restartTimes.push(now);
      try {
        recognition.start();
      } catch {
        session.hardErrorMessage = MIC_MESSAGES.tooManyRestarts;
        finish(session);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      sessionRef.current = null;
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors on unmount
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(() => {
    const recognition = recognitionRef.current;
    const cb = callbacksRef.current;
    if (!recognition) {
      cb.onStatusChange(MIC_MESSAGES.unsupported);
      cb.onUnsupported?.();
      return;
    }

    const session = sessionRef.current;
    if (session && session.active) {
      session.stopRequested = true;
      try {
        recognition.stop();
      } catch {
        // Already stopped: finish from onend will not come, so end here.
        recognition.onend?.();
      }
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    sessionRef.current = newSession(latestInputRef.current || '');
    cb.onStatusChange(DEFAULT_MIC_STATUS);
    cb.onLiveTextChange?.('');
    try {
      recognition.start();
    } catch {
      sessionRef.current = null;
      cb.onStatusChange(MIC_MESSAGES.generic);
    }
  }, []);

  return { toggleMic };
}

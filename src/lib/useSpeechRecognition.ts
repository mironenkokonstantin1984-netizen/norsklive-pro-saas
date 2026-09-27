'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DEFAULT_MIC_STATUS } from '../components/studio/useStudioState';

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionResultItem;
  length: number;
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

export interface UseSpeechRecognitionOptions {
  inputText: string;
  onTranscriptChange: (transcript: string) => void;
  onSubmitTranscript: (transcript: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onStatusChange: (statusText: string) => void;
}

export function useSpeechRecognition({
  inputText,
  onTranscriptChange,
  onSubmitTranscript,
  onRecordingChange,
  onSpeakingChange,
  onStatusChange
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wasRecordingRef = useRef(false);
  const latestInputRef = useRef(inputText);

  useEffect(() => {
    latestInputRef.current = inputText;
  }, [inputText]);

  const callbacksRef = useRef({
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange
  });

  useEffect(() => {
    callbacksRef.current = {
      onTranscriptChange,
      onSubmitTranscript,
      onRecordingChange,
      onSpeakingChange,
      onStatusChange
    };
  }, [
    onTranscriptChange,
    onSubmitTranscript,
    onRecordingChange,
    onSpeakingChange,
    onStatusChange
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
    recognition.continuous = false;

    recognition.onstart = () => {
      wasRecordingRef.current = true;
      callbacksRef.current.onSpeakingChange(false);
      callbacksRef.current.onRecordingChange(true);
      callbacksRef.current.onStatusChange(
        '🔴 Слушаю норвежскую речь (L2 ASR nb-NO)... Говорите!'
      );
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      latestInputRef.current = transcript;
      callbacksRef.current.onTranscriptChange(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      wasRecordingRef.current = false;
      callbacksRef.current.onRecordingChange(false);
      callbacksRef.current.onStatusChange(
        `Статус микрофона: ${event.error}. Можно говорить или писать в поле.`
      );
    };

    recognition.onend = () => {
      const wasRecording = wasRecordingRef.current;
      wasRecordingRef.current = false;
      callbacksRef.current.onRecordingChange(false);
      callbacksRef.current.onStatusChange(DEFAULT_MIC_STATUS);

      const text = (latestInputRef.current || '').trim();
      if (wasRecording && text.length > 1) {
        latestInputRef.current = '';
        callbacksRef.current.onTranscriptChange('');
        callbacksRef.current.onSubmitTranscript(text);
      }
    };

    recognitionRef.current = recognition;

    return () => {
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
    if (!recognition) {
      const fallbackMsg =
        'Используйте браузер Chrome/Edge для голосового распознавания nb-NO или введите ответ текстом.';
      callbacksRef.current.onStatusChange(fallbackMsg);
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        try {
          window.alert(fallbackMsg);
        } catch {
          // Ignore alert errors in headless/test environments
        }
      }
      return;
    }

    if (wasRecordingRef.current) {
      recognition.stop();
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
      recognition.start();
    }
  }, []);

  return { toggleMic };
}

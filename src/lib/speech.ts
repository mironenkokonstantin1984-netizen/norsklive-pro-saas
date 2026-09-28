export interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

export function speakNorwegian(text: string, options: SpeakOptions = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    if (typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'nb-NO';
    utter.rate = options.rate ?? 0.96;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const noVoice = voices.find((v) => v.lang.includes('nb') || v.lang.includes('no'));
    if (noVoice) {
      utter.voice = noVoice;
    }
    if (options.onStart) {
      utter.onstart = options.onStart;
    }
    if (options.onEnd) {
      utter.onend = options.onEnd;
    }
    if (options.onBoundary) {
      utter.onboundary = (event: SpeechSynthesisEvent) => {
        if (typeof event?.charIndex === 'number') {
          options.onBoundary?.(event.charIndex);
        }
      };
    }
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore speech synthesis errors in headless/unsupported environments
  }
}

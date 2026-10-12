export interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

/** Minimal shape of a browser voice, so the ranking can be tested with plain objects. */
export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
  voiceURI?: string;
}

export const VOICE_STORAGE_KEY = 'norsklive_voice';
/** How long to wait for Chrome to load its voice list (it fires `voiceschanged` late). */
export const VOICES_TIMEOUT_MS = 1500;

/** Language tags that mean Norwegian Bokmål (or plain Norwegian), as browsers spell them. */
const BOKMAL_TAGS = new Set(['nb-no', 'nb', 'no-no', 'no']);
const NYNORSK_TAGS = new Set(['nn-no', 'nn']);

function langTag(voice: VoiceLike): string {
  // Android reports «nb_NO», desktop browsers «nb-NO».
  return (voice.lang || '').replace(/_/g, '-').toLowerCase();
}

/**
 * Norwegian voices by exact language tag. Nynorsk is used only when there is no Bokmål voice.
 * (A substring test such as `lang.includes('no')` would also match «Norwegian» lookalikes.)
 */
export function filterNorwegianVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  const bokmal = voices.filter((v) => BOKMAL_TAGS.has(langTag(v)));
  if (bokmal.length > 0) {
    return bokmal;
  }
  return voices.filter((v) => NYNORSK_TAGS.has(langTag(v)));
}

/** Higher is better. Generic engine voices score low, neural and cloud voices score high. */
export function scoreVoice(voice: VoiceLike): number {
  const tag = langTag(voice);
  const name = (voice.name || '').toLowerCase();
  let score = 0;

  if (tag === 'nb-no') score += 100;
  else if (tag === 'nb') score += 90;
  else if (tag === 'no-no') score += 80;
  else if (tag === 'no') score += 70;
  else score += 10;

  if (/natural|online|neural/.test(name)) score += 40;
  if (/\b(nora|pernille|finn|iselin|henrik)\b/.test(name)) score += 25;
  if (/google|microsoft/.test(name)) score += 20;
  // Cloud voices (Chrome, Edge) sound better than the offline ones.
  if (voice.localService === false) score += 15;
  if (/espeak|compact/.test(name)) score -= 40;

  return score;
}

/** Voices of the best quality first. Ties keep the browser's own order. */
export function rankVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  return voices
    .map((voice, index) => ({ voice, index, score: scoreVoice(voice) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.voice);
}

/** The voice the learner chose last time, if the device still has it; otherwise the best one. */
export function pickBestVoice<T extends VoiceLike>(
  voices: readonly T[],
  preferredName?: string | null
): T | null {
  const ranked = rankVoices(voices);
  if (preferredName) {
    const remembered = ranked.find((v) => v.name === preferredName);
    if (remembered) return remembered;
  }
  return ranked[0] ?? null;
}

export function readPreferredVoiceName(): string | null {
  try {
    return window.localStorage.getItem(VOICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function savePreferredVoiceName(name: string | null): void {
  try {
    if (name) {
      window.localStorage.setItem(VOICE_STORAGE_KEY, name);
    } else {
      window.localStorage.removeItem(VOICE_STORAGE_KEY);
    }
  } catch {
    // Private browsing or blocked storage: the choice just does not persist.
  }
}

function hasSynthesis(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Forget the cached voice list (used by tests). */
export function resetVoiceCache(): void {
  voicesPromise = null;
}

/**
 * Norwegian voices of this device, best first. Chrome fills the list asynchronously: the first
 * `getVoices()` call returns an empty array, and `voiceschanged` fires a moment later. We wait
 * for that event (at most `VOICES_TIMEOUT_MS`) instead of speaking with the browser's default
 * voice. Only a non-empty answer is cached, so a late voice pack can still be picked up.
 */
export function getNorwegianVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!hasSynthesis()) {
    return Promise.resolve([]);
  }
  if (voicesPromise) {
    return voicesPromise;
  }
  const synth = window.speechSynthesis;

  const read = (): SpeechSynthesisVoice[] => {
    try {
      return rankVoices(filterNorwegianVoices(synth.getVoices?.() ?? []));
    } catch {
      return [];
    }
  };

  const loaded = read();
  if (loaded.length > 0) {
    voicesPromise = Promise.resolve(loaded);
    return voicesPromise;
  }

  const waiting = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', onChanged);
      const found = read();
      // An empty list is not cached: the voices may still arrive later.
      if (found.length > 0) {
        voicesPromise = Promise.resolve(found);
      } else if (voicesPromise === waiting) {
        voicesPromise = null;
      }
      resolve(found);
    };
    const onChanged = () => {
      if (read().length > 0) finish();
    };
    const timer = setTimeout(finish, VOICES_TIMEOUT_MS);
    synth.addEventListener?.('voiceschanged', onChanged);
  });
  voicesPromise = waiting;
  return waiting;
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

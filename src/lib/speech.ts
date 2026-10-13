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

/** Default speaking speed for a learner; the «Темп речи» setting (0.8 / 1.0) overrides it. */
export const DEFAULT_SPEECH_RATE = 0.92;
/** Browsers stall on long utterances, so text is spoken sentence by sentence. */
export const MAX_CHUNK_CHARS = 200;
export const SENTENCE_PAUSE_MS = 150;

export interface SpeechChunk {
  text: string;
  /** Index of the first character of this chunk in the original text (for subtitle highlighting). */
  offset: number;
}

/**
 * Blanks out what must not be read aloud, keeping every other character at its index: stage
 * directions in square brackets, remarks in parentheses that contain Cyrillic (L1 notes), and
 * emoji. Same length as the input, so boundary indexes still point into the original text.
 */
export function maskNonSpoken(text: string): string {
  const blank = (match: string) => ' '.repeat(match.length);
  return text
    .replace(/\[[^\]]*\]/g, blank)
    .replace(/\([^)]*[\u0400-\u04FF][^)]*\)/g, blank)
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, blank);
}

/** Cuts a too-long sentence at the last comma or space before the limit. */
function cutLongSentence(masked: string, start: number, end: number, max: number): number[] {
  const cuts: number[] = [];
  let from = start;
  while (end - from > max) {
    const window = masked.slice(from, from + max);
    let at = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '));
    if (at < max / 2) at = window.lastIndexOf(' ');
    const cut = at > 0 ? from + at + 1 : from + max;
    cuts.push(cut);
    from = cut;
  }
  return cuts;
}

/** Sentences of at most `max` characters, each with its offset in the original text. */
export function splitIntoSpeechChunks(text: string, max: number = MAX_CHUNK_CHARS): SpeechChunk[] {
  const masked = maskNonSpoken(text);
  const chunks: SpeechChunk[] = [];
  const sentence = /[^.!?;:\n]+[.!?;:]*|[.!?;:]+/g;
  let match: RegExpExecArray | null;
  while ((match = sentence.exec(masked)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const bounds = [start, ...cutLongSentence(masked, start, end, max), end];
    for (let i = 0; i < bounds.length - 1; i++) {
      const raw = masked.slice(bounds[i], bounds[i + 1]);
      const spoken = raw.trim();
      // Punctuation alone is not worth an utterance.
      if (!/[\p{L}\p{N}]/u.test(spoken)) continue;
      chunks.push({ text: spoken, offset: bounds[i] + (raw.length - raw.trimStart().length) });
    }
  }
  return chunks;
}

// --- What the interface needs to know about the voice -------------------------------------

export type VoiceStatus = 'loading' | 'ready' | 'none';

export interface VoiceSnapshot {
  status: VoiceStatus;
  voices: SpeechSynthesisVoice[];
  selectedName: string | null;
}

export const LOADING_VOICE_SNAPSHOT: VoiceSnapshot = {
  status: 'loading',
  voices: [],
  selectedName: null
};

let voiceSnapshot: VoiceSnapshot = LOADING_VOICE_SNAPSHOT;
const voiceListeners = new Set<() => void>();

function setVoiceSnapshot(next: VoiceSnapshot): void {
  voiceSnapshot = next;
  voiceListeners.forEach((listener) => listener());
}

export function subscribeVoices(listener: () => void): () => void {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
}

export function getVoiceSnapshot(): VoiceSnapshot {
  return voiceSnapshot;
}

/** Forget what was learned about this device's voices (used by tests). */
export function resetVoiceState(): void {
  resetVoiceCache();
  voiceSnapshot = LOADING_VOICE_SNAPSHOT;
}

/** Loads the Norwegian voices and publishes them to the interface. */
export async function refreshVoices(): Promise<VoiceSnapshot> {
  const voices = await getNorwegianVoices();
  const best = pickBestVoice(voices, readPreferredVoiceName());
  setVoiceSnapshot({
    status: voices.length > 0 ? 'ready' : 'none',
    voices,
    selectedName: best?.name ?? null
  });
  return voiceSnapshot;
}

/** The learner picked a voice in the settings: remember it and use it from now on. */
export function chooseVoice(name: string): void {
  savePreferredVoiceName(name);
  setVoiceSnapshot({ ...voiceSnapshot, selectedName: name });
}

// --- Speaking ---------------------------------------------------------------------------------

export interface SpeakNorwegianOptions extends SpeakOptions {
  /** The device has no Norwegian voice: nothing is spoken (never with a foreign voice). */
  onNoVoice?: () => void;
}

let speakToken = 0;

/**
 * Speaks Norwegian text with a Norwegian voice only. The text is spoken sentence by sentence
 * with a short pause between sentences; a newer call replaces an older one. Stage directions and
 * L1 notes in brackets are not read. `onBoundary` reports indexes in the original text.
 */
export async function speakNorwegian(
  text: string,
  options: SpeakNorwegianOptions = {}
): Promise<void> {
  if (!hasSynthesis() || typeof SpeechSynthesisUtterance === 'undefined') {
    return;
  }
  const synth = window.speechSynthesis;
  const token = ++speakToken;
  try {
    // One cancel per message, not per sentence: it clears the previous message.
    synth.cancel();
  } catch {
    // Ignore: some engines throw while idle.
  }

  const voices = await getNorwegianVoices();
  if (token !== speakToken) return;

  const best = pickBestVoice(voices, readPreferredVoiceName());
  if (voices.length > 0 && voiceSnapshot.status !== 'ready') {
    setVoiceSnapshot({ status: 'ready', voices, selectedName: best?.name ?? null });
  } else if (voices.length === 0 && voiceSnapshot.status !== 'none') {
    setVoiceSnapshot({ status: 'none', voices: [], selectedName: null });
  }
  if (!best) {
    options.onNoVoice?.();
    return;
  }

  const chunks = splitIntoSpeechChunks(text);
  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  const current = () => token === speakToken;
  const last = chunks.length - 1;

  const speakChunk = (index: number, attempt: number): void => {
    const chunk = chunks[index];
    try {
      const utter = new SpeechSynthesisUtterance(chunk.text);
      utter.voice = best;
      utter.lang = best.lang || 'nb-NO';
      utter.rate = options.rate ?? DEFAULT_SPEECH_RATE;
      utter.onstart = () => {
        if (index === 0 && current()) options.onStart?.();
      };
      utter.onboundary = (event: SpeechSynthesisEvent) => {
        if (current() && typeof event?.charIndex === 'number') {
          options.onBoundary?.(chunk.offset + event.charIndex);
        }
      };
      utter.onend = () => {
        if (!current()) return;
        if (index === last) {
          options.onEnd?.();
          return;
        }
        setTimeout(() => {
          if (current()) speakChunk(index + 1, 1);
        }, SENTENCE_PAUSE_MS);
      };
      utter.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (!current()) return;
        if (event?.error === 'synthesis-failed' && attempt < 2) {
          speakChunk(index, attempt + 1);
          return;
        }
        // Cancelled from outside, or the engine gave up: stop quietly.
        options.onEnd?.();
      };
      synth.speak(utter);
    } catch {
      // Headless or unsupported environment: nothing to speak with.
      if (current()) options.onEnd?.();
    }
  };

  speakChunk(0, 1);
}

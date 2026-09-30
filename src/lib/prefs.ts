export type TextSizeStep = 'sm' | 'md' | 'lg';
export type ExaminerTempo = 0.8 | 1.0;
export type LearnerMood = 'Спокойно' | 'Нормально' | 'Тревожно';

export interface PracticePrefs {
  textSize: TextSizeStep;
  tempo: ExaminerTempo;
  subtitles: boolean;
  contrast: boolean;
  /** Send the recognised text right after «Готово» instead of letting the learner edit it. */
  autoSend: boolean;
  mood?: LearnerMood;
  timestamp?: string;
}

export const PREFS_STORAGE_KEY = 'norsklive_prefs';

export const DEFAULT_PRACTICE_PREFS: PracticePrefs = {
  textSize: 'sm',
  tempo: 1.0,
  subtitles: true,
  contrast: false,
  autoSend: false
};

export function loadPracticePrefs(): PracticePrefs {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PRACTICE_PREFS };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PRACTICE_PREFS };
    }
    const parsed = JSON.parse(raw) as Partial<PracticePrefs>;
    const textSize: TextSizeStep =
      parsed.textSize === 'sm' || parsed.textSize === 'md' || parsed.textSize === 'lg'
        ? parsed.textSize
        : DEFAULT_PRACTICE_PREFS.textSize;
    const tempo: ExaminerTempo = parsed.tempo === 0.8 ? 0.8 : 1.0;
    const subtitles =
      typeof parsed.subtitles === 'boolean'
        ? parsed.subtitles
        : DEFAULT_PRACTICE_PREFS.subtitles;
    const contrast =
      typeof parsed.contrast === 'boolean'
        ? parsed.contrast
        : DEFAULT_PRACTICE_PREFS.contrast;
    const autoSend =
      typeof parsed.autoSend === 'boolean' ? parsed.autoSend : DEFAULT_PRACTICE_PREFS.autoSend;
    const mood =
      parsed.mood === 'Спокойно' || parsed.mood === 'Нормально' || parsed.mood === 'Тревожно'
        ? parsed.mood
        : undefined;
    const timestamp = typeof parsed.timestamp === 'string' ? parsed.timestamp : undefined;

    return {
      textSize,
      tempo,
      subtitles,
      contrast,
      autoSend,
      ...(mood ? { mood } : {}),
      ...(timestamp ? { timestamp } : {})
    };
  } catch {
    return { ...DEFAULT_PRACTICE_PREFS };
  }
}

export function savePracticePrefs(nextPrefs: PracticePrefs): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(nextPrefs));
  } catch {
    // Ignore storage errors (private browsing / quota / disabled localStorage)
  }
}

export function applyPracticePrefsToDocument(prefs: PracticePrefs): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.setAttribute('data-text-size', prefs.textSize);
  root.classList.remove('text-size-sm', 'text-size-md', 'text-size-lg');
  root.classList.add(`text-size-${prefs.textSize}`);

  if (prefs.contrast) {
    root.setAttribute('data-theme', 'contrast');
  } else if (root.getAttribute('data-theme') === 'contrast') {
    root.removeAttribute('data-theme');
  }
}

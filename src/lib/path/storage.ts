import { applyDocumentLang } from '../documentLang';

export type TargetCefrLevel = 'A2' | 'B1' | 'B2';
export type PathL1 = 'ru' | 'uk' | 'en';

export interface PathPrefs {
  onboarded?: boolean;
  targetLevel: TargetCefrLevel;
  l1?: PathL1;
  examDate?: string;
}

export const PATH_STORAGE_KEY = 'norsklive_path';
const LEGACY_PATH_STORAGE_KEY = 'norsklive:path';
export const GLOSSARY_STORAGE_KEY = 'norsklive_glossary';

export const DEFAULT_PATH_PREFS: PathPrefs = {
  onboarded: false,
  targetLevel: 'B1',
  l1: 'ru'
};

export function readPathPrefs(): PathPrefs {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PATH_PREFS };
  }
  try {
    const raw =
      window.localStorage.getItem(PATH_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_PATH_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PATH_PREFS };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const targetLevel: TargetCefrLevel =
      parsed.targetLevel === 'A2' || parsed.targetLevel === 'B1' || parsed.targetLevel === 'B2'
        ? parsed.targetLevel
        : 'B1';
    const rawL1 = parsed.l1;
    const l1: PathL1 =
      rawL1 === 'uk' || rawL1 === 'ua'
        ? 'uk'
        : rawL1 === 'en'
          ? 'en'
          : 'ru';
    const onboarded = parsed.onboarded === true;
    const examDate =
      typeof parsed.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.examDate)
        ? parsed.examDate
        : undefined;
    return {
      onboarded,
      targetLevel,
      l1,
      ...(examDate ? { examDate } : {})
    };
  } catch {
    return { ...DEFAULT_PATH_PREFS };
  }
}

export function writePathPrefs(patch: Partial<PathPrefs>): PathPrefs {
  const current = readPathPrefs();
  const nextTargetLevel: TargetCefrLevel =
    patch.targetLevel === 'A2' || patch.targetLevel === 'B1' || patch.targetLevel === 'B2'
      ? patch.targetLevel
      : current.targetLevel;
  const nextL1: PathL1 =
    patch.l1 === 'uk' || patch.l1 === 'en' || patch.l1 === 'ru'
      ? patch.l1
      : current.l1 ?? 'ru';
  const nextOnboarded =
    typeof patch.onboarded === 'boolean' ? patch.onboarded : Boolean(current.onboarded);

  let nextExamDate = current.examDate;
  if ('examDate' in patch) {
    const trimmed = patch.examDate ? patch.examDate.trim() : '';
    nextExamDate =
      trimmed && /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
  }

  const next: PathPrefs = {
    onboarded: nextOnboarded,
    targetLevel: nextTargetLevel,
    l1: nextL1,
    ...(nextExamDate ? { examDate: nextExamDate } : {})
  };

  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(next);
      window.localStorage.setItem(PATH_STORAGE_KEY, serialized);
      window.localStorage.setItem(LEGACY_PATH_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage errors
    }
  }
  applyDocumentLang(next.l1);

  return next;
}

export function writeExamDate(date: string | null): PathPrefs {
  return writePathPrefs({ examDate: date ?? undefined });
}

export function readSavedWordsCount(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(GLOSSARY_STORAGE_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function getOsloDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function daysUntilExam(examDate: string, now: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    return null;
  }
  const todayStr = getOsloDateString(now);
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [ey, em, ed] = examDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const examUtc = Date.UTC(ey, em - 1, ed);
  const diffDays = Math.round((examUtc - todayUtc) / 86400000);
  return Math.max(0, diffDays);
}

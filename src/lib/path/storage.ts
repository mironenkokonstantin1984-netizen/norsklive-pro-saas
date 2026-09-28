export type TargetCefrLevel = 'A2' | 'B1' | 'B2';

export interface PathPrefs {
  examDate?: string;
  targetLevel: TargetCefrLevel;
}

export const PATH_STORAGE_KEY = 'norsklive_path';
export const GLOSSARY_STORAGE_KEY = 'norsklive_glossary';

export const DEFAULT_PATH_PREFS: PathPrefs = {
  targetLevel: 'B1'
};

export function readPathPrefs(): PathPrefs {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PATH_PREFS };
  }
  try {
    const raw = window.localStorage.getItem(PATH_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PATH_PREFS };
    }
    const parsed = JSON.parse(raw) as Partial<PathPrefs>;
    const targetLevel: TargetCefrLevel =
      parsed.targetLevel === 'A2' || parsed.targetLevel === 'B1' || parsed.targetLevel === 'B2'
        ? parsed.targetLevel
        : 'B1';
    const examDate =
      typeof parsed.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.examDate)
        ? parsed.examDate
        : undefined;
    return {
      targetLevel,
      ...(examDate ? { examDate } : {})
    };
  } catch {
    return { ...DEFAULT_PATH_PREFS };
  }
}

export function writeExamDate(date: string | null): PathPrefs {
  const current = readPathPrefs();
  const trimmed = date ? date.trim() : '';
  const next: PathPrefs = {
    targetLevel: current.targetLevel,
    ...(trimmed && /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? { examDate: trimmed } : {})
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PATH_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
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

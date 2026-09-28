// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GLOSSARY_STORAGE_KEY,
  PATH_STORAGE_KEY,
  daysUntilExam,
  readPathPrefs,
  readSavedWordsCount,
  writeExamDate
} from '../src/lib/path/storage';

describe('path storage helpers (Issue #28 subtask 1)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns safe defaults when localStorage is empty', () => {
    expect(readPathPrefs()).toEqual({ targetLevel: 'B1' });
    expect(readSavedWordsCount()).toBe(0);
  });

  it('writes and clears examDate on norsklive_path', () => {
    const updated = writeExamDate('2026-11-15');
    expect(updated).toEqual({ targetLevel: 'B1', examDate: '2026-11-15' });
    expect(readPathPrefs()).toEqual({ targetLevel: 'B1', examDate: '2026-11-15' });

    const cleared = writeExamDate(null);
    expect(cleared).toEqual({ targetLevel: 'B1' });
    expect(readPathPrefs()).toEqual({ targetLevel: 'B1' });
  });

  it('reads saved words count from norsklive_glossary array', () => {
    window.localStorage.setItem(
      GLOSSARY_STORAGE_KEY,
      JSON.stringify([
        { word: 'fleksibilitet', translation: 'гибкость' },
        { word: 'hjemmekontor', translation: 'удалённая работа' },
        { word: 'arbeidsmiljø', translation: 'рабочая среда' }
      ])
    );
    expect(readSavedWordsCount()).toBe(3);
  });

  it('computes daysUntilExam in Europe/Oslo date', () => {
    const mockNow = new Date('2026-10-01T12:00:00Z');
    expect(daysUntilExam('2026-10-15', mockNow)).toBe(14);
    expect(daysUntilExam('2026-10-01', mockNow)).toBe(0);
    expect(daysUntilExam('invalid', mockNow)).toBeNull();
  });

  it('returns safe defaults and does not throw when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(readPathPrefs()).toEqual({ targetLevel: 'B1' });
    expect(readSavedWordsCount()).toBe(0);
    expect(() => writeExamDate('2026-11-20')).not.toThrow();
    expect(
      window.localStorage.getItem === undefined || readPathPrefs().targetLevel === 'B1'
    ).toBe(true);
    expect(PATH_STORAGE_KEY).toBe('norsklive_path');
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GLOSSARY_STORAGE_KEY,
  PATH_STORAGE_KEY,
  daysUntilExam,
  readPathPrefs,
  readSavedWordsCount,
  writeExamDate,
  writePathPrefs
} from '../src/lib/path/storage';

describe('path storage helpers (Issue #28 & Issue #36 subtask 2)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns safe defaults when localStorage is empty', () => {
    expect(readPathPrefs()).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru'
    });
    expect(readSavedWordsCount()).toBe(0);
  });

  it('writes and clears examDate on norsklive_path while preserving onboarded, targetLevel, and l1', () => {
    const updated = writeExamDate('2026-11-15');
    expect(updated).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru',
      examDate: '2026-11-15'
    });
    expect(readPathPrefs()).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru',
      examDate: '2026-11-15'
    });

    const cleared = writeExamDate(null);
    expect(cleared).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru'
    });
    expect(readPathPrefs()).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru'
    });
  });

  it('writes and reads onboarded, targetLevel, l1 (ru | uk | en), and examDate via writePathPrefs', () => {
    const saved = writePathPrefs({
      onboarded: true,
      targetLevel: 'B2',
      l1: 'uk',
      examDate: '2026-12-01'
    });
    expect(saved).toEqual({
      onboarded: true,
      targetLevel: 'B2',
      l1: 'uk',
      examDate: '2026-12-01'
    });
    expect(readPathPrefs()).toEqual({
      onboarded: true,
      targetLevel: 'B2',
      l1: 'uk',
      examDate: '2026-12-01'
    });
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

    expect(readPathPrefs()).toEqual({
      onboarded: false,
      targetLevel: 'B1',
      l1: 'ru'
    });
    expect(readSavedWordsCount()).toBe(0);
    expect(() => writeExamDate('2026-11-20')).not.toThrow();
    expect(() => writePathPrefs({ onboarded: true, l1: 'en' })).not.toThrow();
    expect(PATH_STORAGE_KEY).toBe('norsklive_path');
  });
});

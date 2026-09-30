import type { WordItem } from './schema';
import {
  createInitialCardState,
  DEFAULT_NEW_PER_DAY,
  isWordKnown,
  type AdaptiveState,
  type WordCardState
} from './scheduler';

export const WORDS_STORAGE_KEY = 'norsklive_words';

export interface WordsProgressData {
  cards: Record<string, WordCardState>;
  adaptive: AdaptiveState;
}

export interface SessionQueueItem {
  item: WordItem;
  card: WordCardState;
  isNew: boolean;
}

export interface DailySessionPlan {
  dueCards: SessionQueueItem[];
  newCards: SessionQueueItem[];
  queue: SessionQueueItem[];
}

export function createDefaultWordsProgress(): WordsProgressData {
  return {
    cards: {},
    adaptive: {
      newPerDay: DEFAULT_NEW_PER_DAY,
      recentOutcomes: [],
      hintFadeStepOffset: 0
    }
  };
}

export function readWordsProgress(): WordsProgressData {
  if (typeof window === 'undefined') {
    return createDefaultWordsProgress();
  }
  try {
    const raw = window.localStorage.getItem(WORDS_STORAGE_KEY);
    if (!raw) {
      return createDefaultWordsProgress();
    }
    const parsed = JSON.parse(raw) as Partial<WordsProgressData>;
    const defaults = createDefaultWordsProgress();
    return {
      cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : {},
      adaptive: {
        newPerDay:
          typeof parsed.adaptive?.newPerDay === 'number'
            ? parsed.adaptive.newPerDay
            : defaults.adaptive.newPerDay,
        recentOutcomes: Array.isArray(parsed.adaptive?.recentOutcomes)
          ? parsed.adaptive.recentOutcomes
          : [],
        hintFadeStepOffset:
          typeof parsed.adaptive?.hintFadeStepOffset === 'number'
            ? parsed.adaptive.hintFadeStepOffset
            : 0
      }
    };
  } catch {
    return createDefaultWordsProgress();
  }
}

export function writeWordsProgress(data: WordsProgressData): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota or security errors
  }
}

export function countKnownWords(
  progress: WordsProgressData,
  catalog?: WordItem[]
): number {
  const validIds = catalog ? new Set(catalog.map((w) => w.id)) : null;
  let count = 0;
  for (const card of Object.values(progress.cards)) {
    if (validIds && !validIds.has(card.wordId)) continue;
    if (isWordKnown(card)) {
      count += 1;
    }
  }
  return count;
}

export function buildDailySession(
  now: Date = new Date(),
  catalog: WordItem[],
  progress: WordsProgressData = readWordsProgress()
): DailySessionPlan {
  const dueCards: SessionQueueItem[] = [];
  const newCards: SessionQueueItem[] = [];
  const nowMs = now.getTime();

  for (const item of catalog) {
    const existing = progress.cards[item.id];
    if (existing) {
      const dueMs = new Date(existing.fsrsCard.due).getTime();
      if (dueMs <= nowMs) {
        dueCards.push({
          item,
          card: existing,
          isNew: false
        });
      }
    } else if (newCards.length < progress.adaptive.newPerDay) {
      newCards.push({
        item,
        card: createInitialCardState(item.id, now),
        isNew: true
      });
    }
  }

  return {
    dueCards,
    newCards,
    queue: [...dueCards, ...newCards]
  };
}

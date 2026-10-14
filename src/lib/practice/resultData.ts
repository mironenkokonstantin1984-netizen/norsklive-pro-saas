import type { CoachFeedback } from '../../server/schemas';
import type { ScoreBarLevel } from '../../components/studio/ScoreBar';
import { readWordsProgress, writeWordsProgress } from '../words/progress';
import { createInitialCardState } from '../words/scheduler';

export const PRACTICE_RESULT_STORAGE_KEY = 'norsklive_practice_result';

export interface StumbledWord {
  id: string;
  word: string;
  translation?: string;
}

export interface ImprovementItem {
  type: string;
  typeTitle: string;
  ruleName: string;
  explanation: string;
  quote?: string;
  fix?: string;
}

export interface PracticeResultCriteria {
  uttale: ScoreBarLevel;
  ordforrad: ScoreBarLevel;
  grammatikk: ScoreBarLevel;
  samhandling: ScoreBarLevel;
}

export interface PracticeTurnSummary {
  sender: 'user' | 'ai';
  text: string;
  feedback?: CoachFeedback;
  time?: string;
}

export interface PracticeResultData {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  module: string;
  isExam: boolean;
  examPart?: number;
  completedAt: string;
  learnerTurnCount: number;
  hasEnoughData: boolean; // false if learnerTurnCount < 3
  criteria: PracticeResultCriteria;
  improvements: ImprovementItem[];
  stumbledWords: StumbledWord[];
  turns: PracticeTurnSummary[];
}

export const ERROR_TYPE_TITLES: Record<string, string> = {
  word_order: 'Порядок слов',
  verb_form: 'Формы глаголов',
  article: 'Артикли и род',
  preposition: 'Предлоги',
  vocabulary: 'Словарный запас',
  spelling: 'Орфография',
  other: 'Грамматика'
};

/**
 * Calculates 4 HK-dir criteria levels from session data.
 */
export function calculatePracticeScores(
  feedbacks: CoachFeedback[],
  targetWordsUsedCount: number,
  totalTargetWordsCount: number
): PracticeResultCriteria {
  if (feedbacks.length === 0) {
    return {
      uttale: null,
      ordforrad: null,
      grammatikk: null,
      samhandling: null
    };
  }

  // Collect level estimates
  const estimates = feedbacks.map((f) => f.level_estimate);
  const b1Count = estimates.filter((e) => e === 'B1' || e === 'B2').length;
  const a2Count = estimates.filter((e) => e === 'A2').length;
  const generalLevel: ScoreBarLevel = b1Count >= a2Count ? 'B1' : 'A2';

  // Grammar score based on grammar errors
  const allErrors = feedbacks.flatMap((f) => f.errors || []);
  const grammarErrors = allErrors.filter(
    (e) => e.type === 'word_order' || e.type === 'verb_form' || e.type === 'article'
  );

  let grammatikk: ScoreBarLevel = generalLevel;
  if (grammarErrors.length === 0 && b1Count > 0) {
    grammatikk = 'B1';
  } else if (grammarErrors.length >= 3) {
    grammatikk = 'A2';
  }

  // Vocabulary score based on target words used and vocabulary errors
  const vocabErrors = allErrors.filter((e) => e.type === 'vocabulary');
  let ordforrad: ScoreBarLevel = generalLevel;
  const usageRatio = totalTargetWordsCount > 0 ? targetWordsUsedCount / totalTargetWordsCount : 0;
  if (usageRatio >= 0.4 || targetWordsUsedCount >= 2) {
    ordforrad = 'B1';
  } else if (vocabErrors.length >= 2) {
    ordforrad = 'A2';
  }

  // Interaction (Samhandling) based on dialogue feedback
  const hasSamhandlingPraise = feedbacks.some((f) => Boolean(f.samhandling_l1));
  const samhandling: ScoreBarLevel = hasSamhandlingPraise || generalLevel === 'B1' ? 'B1' : 'A2';

  // Pronunciation (Uttale) estimated alongside overall performance
  const uttale: ScoreBarLevel = generalLevel;

  return {
    uttale,
    ordforrad,
    grammatikk,
    samhandling
  };
}

/**
 * Extracts 1 to 3 improvement items grouped by error type.
 */
export function extractImprovements(feedbacks: CoachFeedback[]): ImprovementItem[] {
  const allErrors = feedbacks.flatMap((f) => f.errors || []);
  if (allErrors.length === 0) {
    return [];
  }

  const byType = new Map<string, typeof allErrors>();
  for (const err of allErrors) {
    const list = byType.get(err.type) || [];
    list.push(err);
    byType.set(err.type, list);
  }

  // Sort groups by error frequency descending
  const sortedTypes = [...byType.entries()].sort((a, b) => b[1].length - a[1].length);

  const improvements: ImprovementItem[] = [];
  for (const [type, errors] of sortedTypes.slice(0, 3)) {
    const first = errors[0];
    improvements.push({
      type,
      typeTitle: ERROR_TYPE_TITLES[type] || 'Грамматика',
      ruleName: first.rule_name_l1,
      explanation: first.explanation_l1,
      quote: first.quote,
      fix: first.fix
    });
  }

  return improvements;
}

/**
 * Extracts words the learner stumbled on or had errors on.
 */
export function extractStumbledWords(
  feedbacks: CoachFeedback[],
  targetWords: Array<{ word: string; translation?: string }> = []
): StumbledWord[] {
  const wordMap = new Map<string, StumbledWord>();

  for (const fb of feedbacks) {
    for (const err of (fb.errors || [])) {
      if (err.fix) {
        // Find single-word fix or quote
        const candidate = err.fix.trim().split(/\s+/)[0].toLowerCase().replace(/[.,!?:;]/g, '');
        if (candidate.length > 2 && !wordMap.has(candidate)) {
          const matchedTarget = targetWords.find((t) => t.word.toLowerCase() === candidate);
          wordMap.set(candidate, {
            id: candidate,
            word: matchedTarget?.word || err.fix,
            translation: matchedTarget?.translation || err.rule_name_l1
          });
        }
      }
    }
  }

  // If few stumbled words, add target words from scenario for review
  if (wordMap.size < 3 && targetWords.length > 0) {
    for (const tw of targetWords) {
      const key = tw.word.toLowerCase();
      if (!wordMap.has(key)) {
        wordMap.set(key, {
          id: key,
          word: tw.word,
          translation: tw.translation
        });
      }
      if (wordMap.size >= 3) break;
    }
  }

  return [...wordMap.values()].slice(0, 5);
}

/**
 * Saves a word to the user's personal deck used by /words.
 */
export function addWordToDeck(wordId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const progress = readWordsProgress();
    if (!progress.cards[wordId]) {
      progress.cards[wordId] = createInitialCardState(wordId, new Date());
      writeWordsProgress(progress);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds markdown report from practice result.
 */
export function buildPracticeResultMarkdown(result: PracticeResultData): string {
  const lines: string[] = [
    `# 🇳🇴 NorskLive Pro — Отчёт о практике (${new Date(result.completedAt).toLocaleDateString()})`,
    `**Тема:** ${result.scenarioTitle} | **Режим:** ${result.isExam ? 'Экзамен' : 'Учёба'}`,
    `**Количество реплик:** ${result.learnerTurnCount}`,
    ``,
    `## Оценка критериев HK-dir`,
    result.hasEnoughData
      ? [
          `- **Произношение:** ${result.criteria.uttale || 'Нет данных'}`,
          `- **Словарь:** ${result.criteria.ordforrad || 'Нет данных'}`,
          `- **Грамматика:** ${result.criteria.grammatikk || 'Нет данных'}`,
          `- **Взаимодействие:** ${result.criteria.samhandling || 'Нет данных'}`
        ].join('\n')
      : `*Слишком мало ответов для оценки.*`,
    ``,
    `*Оценка ориентировочная, это тренажёр, а не экзамен.*`,
    ``
  ];

  if (result.improvements.length > 0) {
    lines.push(`## Что улучшить`);
    for (const item of result.improvements) {
      lines.push(
        `- **${item.typeTitle} (${item.ruleName}):** ${item.explanation}` +
          (item.quote && item.fix ? ` *(${item.quote} → ${item.fix})*` : '')
      );
    }
    lines.push(``);
  }

  if (result.stumbledWords.length > 0) {
    lines.push(`## Слова для повторения`);
    for (const w of result.stumbledWords) {
      lines.push(`- **${w.word}**${w.translation ? ` — ${w.translation}` : ''}`);
    }
    lines.push(``);
  }

  if (result.turns.length > 0) {
    lines.push(`## История реплик`);
    for (const t of result.turns) {
      const sender = t.sender === 'ai' ? 'Экзаменатор' : 'Ученик';
      lines.push(`- **${sender}:** ${t.text}`);
    }
  }

  return lines.join('\n');
}

/**
 * Local storage persistence for practice result.
 */
export function savePracticeResult(result: PracticeResultData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRACTICE_RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Ignore quota errors
  }
}

export function readPracticeResult(): PracticeResultData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PRACTICE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PracticeResultData;
  } catch {
    return null;
  }
}

export function clearPracticeResult(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PRACTICE_RESULT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import type { WordCloze, WordItem } from './schema';

export type WordGrade = 'again' | 'hard' | 'good' | 'easy';
export type MasteryStage = 1 | 2 | 3 | 4 | 5;

export interface SerializedFsrsCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface WordCardState {
  wordId: string;
  stage: MasteryStage;
  fsrsCard: SerializedFsrsCard;
  lastGrade?: WordGrade;
  stage3Successes: number;
  clozeIndex: number;
  seenClozeIndices: number[];
}

export interface AdaptiveState {
  newPerDay: number;
  recentOutcomes: boolean[];
  hintFadeStepOffset: number;
}

export const TARGET_RETENTION = 0.88;
export const DEFAULT_NEW_PER_DAY = 10;
export const MIN_NEW_PER_DAY = 5;
export const MAX_NEW_PER_DAY = 15;
export const ADAPTIVE_WINDOW_SIZE = 20;

const fScheduler = fsrs({
  request_retention: TARGET_RETENTION,
  maximum_interval: 3650,
  enable_fuzz: false,
  enable_short_term: false
});

export function serializeFsrsCard(card: Card): SerializedFsrsCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined
  };
}

export function deserializeFsrsCard(raw: SerializedFsrsCard): Card {
  return {
    due: new Date(raw.due),
    stability: raw.stability,
    difficulty: raw.difficulty,
    elapsed_days: raw.elapsed_days,
    scheduled_days: raw.scheduled_days,
    learning_steps: raw.learning_steps,
    reps: raw.reps,
    lapses: raw.lapses,
    state: raw.state,
    last_review: raw.last_review ? new Date(raw.last_review) : undefined
  };
}

export function createInitialCardState(wordId: string, now: Date = new Date()): WordCardState {
  return {
    wordId,
    stage: 1,
    fsrsCard: serializeFsrsCard(createEmptyCard(now)),
    stage3Successes: 0,
    clozeIndex: 0,
    seenClozeIndices: []
  };
}

function mapGradeToRating(grade: WordGrade): Rating {
  switch (grade) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
  }
}

export function isWordKnown(card: Pick<WordCardState, 'stage'>): boolean {
  return card.stage >= 4;
}

export function gradeWordCard(
  cardState: WordCardState,
  grade: WordGrade,
  now: Date = new Date(),
  options?: { typedCorrect?: boolean }
): WordCardState {
  const rating = mapGradeToRating(grade);
  const currentCard = deserializeFsrsCard(cardState.fsrsCard);
  const scheduled = fScheduler.next(currentCard, now, rating);
  const nextCard: Card = { ...scheduled.card };

  let nextStage: MasteryStage = cardState.stage;
  let nextStage3Successes = cardState.stage3Successes;

  // Rule: «Легко» followed by a wrong typed answer moves it back
  if (options?.typedCorrect === false && cardState.lastGrade === 'easy') {
    nextStage = Math.max(2, cardState.stage - 1) as MasteryStage;
    nextStage3Successes = Math.max(0, nextStage3Successes - 1);
  } else if (grade === 'again') {
    nextStage = Math.max(2, cardState.stage - 1) as MasteryStage;
    nextStage3Successes = Math.max(0, nextStage3Successes - 1);
    // Bring card back today on "again"
    nextCard.due = new Date(now.getTime());
    nextCard.scheduled_days = 0;
  } else if (grade === 'hard') {
    nextStage = Math.max(2, cardState.stage) as MasteryStage;
  } else if (grade === 'good' || grade === 'easy') {
    if (cardState.stage === 3 && options?.typedCorrect !== false) {
      nextStage3Successes += 1;
    }
    nextStage = Math.min(4, cardState.stage + 1) as MasteryStage;
  }

  return {
    ...cardState,
    stage: nextStage,
    fsrsCard: serializeFsrsCard(nextCard),
    lastGrade: grade,
    stage3Successes: nextStage3Successes
  };
}

export function completeIntroStage(
  cardState: WordCardState,
  now: Date = new Date()
): WordCardState {
  return {
    ...cardState,
    stage: Math.max(2, cardState.stage) as MasteryStage,
    fsrsCard: {
      ...cardState.fsrsCard,
      due: now.toISOString()
    }
  };
}

export function updateAdaptiveState(
  state: AdaptiveState,
  outcomeCorrect: boolean
): AdaptiveState {
  const recentOutcomes = [...state.recentOutcomes, outcomeCorrect].slice(-ADAPTIVE_WINDOW_SIZE);
  let newPerDay = state.newPerDay;
  let hintFadeStepOffset = state.hintFadeStepOffset;

  if (recentOutcomes.length >= ADAPTIVE_WINDOW_SIZE) {
    const correctCount = recentOutcomes.filter(Boolean).length;
    const accuracy = correctCount / recentOutcomes.length;

    if (accuracy > 0.95) {
      newPerDay = Math.min(MAX_NEW_PER_DAY, newPerDay + 2);
      hintFadeStepOffset = 1;
    } else if (accuracy < 0.75) {
      newPerDay = Math.max(MIN_NEW_PER_DAY, newPerDay - 2);
      hintFadeStepOffset = 0;
    }
  }

  return {
    newPerDay,
    recentOutcomes,
    hintFadeStepOffset
  };
}

export type Stage3HintLevel = 'letter_and_article' | 'article_only' | 'none';

export function getStage3Hint(
  item: WordItem,
  cardState: Pick<WordCardState, 'stage3Successes'>,
  adaptive: Pick<AdaptiveState, 'hintFadeStepOffset'>
): { level: Stage3HintLevel; text: string } {
  const step = cardState.stage3Successes + adaptive.hintFadeStepOffset;
  const article =
    item.pos === 'noun'
      ? item.gender === 'm'
        ? 'en'
        : item.gender === 'f'
          ? 'ei / en'
          : 'et'
      : item.pos === 'verb'
        ? 'å'
        : '';

  const firstChar = item.lemma.trim().charAt(0);

  if (step <= 0) {
    const hintText = article ? `${article} ${firstChar}...` : `${firstChar}...`;
    return { level: 'letter_and_article', text: hintText };
  }
  if (step === 1) {
    const hintText = article ? `${article} ___` : `${firstChar}...`;
    return { level: 'article_only', text: hintText };
  }
  return { level: 'none', text: '' };
}

function normalizeText(input: string): string {
  return input
    .trim()
    .replace(/[.!?,;:…]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function getCanonicalDisplayLemma(item: WordItem): string {
  if (item.pos === 'noun') {
    const art = item.gender === 'm' ? 'en' : item.gender === 'f' ? 'ei' : 'et';
    return `${art} ${item.lemma}`;
  }
  if (item.pos === 'verb') {
    return `å ${item.lemma}`;
  }
  return item.lemma;
}

export function checkStage3Answer(
  item: WordItem,
  rawInput: string
): { correct: boolean; expected: string } {
  const normalized = normalizeText(rawInput);
  const expected = getCanonicalDisplayLemma(item);

  if (!normalized) {
    return { correct: false, expected };
  }

  if (item.pos === 'noun') {
    const validArticles =
      item.gender === 'm'
        ? ['en']
        : item.gender === 'f'
          ? ['ei', 'en']
          : ['et'];
    const accepted = new Set<string>();
    for (const art of validArticles) {
      accepted.add(`${art} ${item.lemma.toLowerCase()}`);
      if (item.forms.ub_ent) {
        const bareUbEnt = item.forms.ub_ent.replace(/^(en|ei|et)\s+/i, '').toLowerCase();
        accepted.add(`${art} ${bareUbEnt}`);
      }
    }
    // Also accept definite forms that encode the article (e.g. jobben, leiligheten, huset, stua, stuen)
    if (item.forms.be_ent) {
      accepted.add(item.forms.be_ent.toLowerCase());
      if (item.gender === 'f' && item.forms.be_ent.endsWith('a')) {
        accepted.add(item.forms.be_ent.slice(0, -1).toLowerCase() + 'en');
      }
    }

    return {
      correct: accepted.has(normalized),
      expected
    };
  }

  const accepted = new Set<string>();
  accepted.add(normalizeText(item.lemma));
  if (item.pos === 'verb') {
    accepted.add(`å ${normalizeText(item.lemma)}`);
  }
  for (const formVal of Object.values(item.forms)) {
    accepted.add(normalizeText(formVal));
  }

  return {
    correct: accepted.has(normalized),
    expected
  };
}

export function checkStage4Answer(
  cloze: WordCloze,
  rawInput: string
): { correct: boolean; expected: string } {
  const normalized = normalizeText(rawInput);
  const accepted = new Set<string>([normalizeText(cloze.answer)]);
  for (const alt of cloze.accept ?? []) {
    accepted.add(normalizeText(alt));
  }

  return {
    correct: Boolean(normalized) && accepted.has(normalized),
    expected: cloze.answer
  };
}

import wordsJson from '../../../data/words/a1-a2.json';
import phrasesJson from '../../../data/words/phrases.json';
import { WordDatasetSchema, type WordItem } from './schema';

export const DRAFT_WORD_LABEL = 'Черновик, проверяется преподавателем';

let cachedAllItems: WordItem[] | null = null;

export function getAllCatalogItems(): WordItem[] {
  if (!cachedAllItems) {
    const parsedWords = WordDatasetSchema.parse(wordsJson);
    const parsedPhrases = WordDatasetSchema.parse(phrasesJson);
    cachedAllItems = [...parsedWords, ...parsedPhrases];
  }
  return cachedAllItems;
}

export function shouldShowDraftWords(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.VERCEL_ENV === 'production') {
    return false;
  }
  if (env.WORDS_SHOW_DRAFTS === 'true') {
    return true;
  }
  if (env.WORDS_SHOW_DRAFTS === 'false') {
    return false;
  }
  if (env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export function getVisibleWords(options?: {
  items?: WordItem[];
  showDrafts?: boolean;
  env?: Record<string, string | undefined>;
}): WordItem[] {
  const sourceItems = options?.items ?? getAllCatalogItems();
  const showDrafts =
    options?.showDrafts !== undefined
      ? options.showDrafts && options?.env?.VERCEL_ENV !== 'production'
      : shouldShowDraftWords(options?.env);

  if (showDrafts) {
    return sourceItems;
  }
  return sourceItems.filter((item) => item.status === 'reviewed');
}

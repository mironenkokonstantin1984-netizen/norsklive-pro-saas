export interface VoiceLabScoreResult {
  wer: number;
  werPercent: number;
  errorPreservationRate: number;
  errorWordsCount: number;
  preservedErrorsCount: number;
}

/**
 * Normalises a text string for word-level comparison:
 * lowercases, strips punctuation, and splits into non-empty words.
 */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Computes Levenshtein edit distance between two word arrays.
 */
export function wordEditDistance(ref: string[], hyp: string[]): number {
  const m = ref.length;
  const n = hyp.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculates Word Error Rate (WER) of `transcript` vs `actuallySaid` (0 to 1, e.g. 0 = 0%)
 * and error-preservation rate (0 to 100%, e.g. 100 = 100% of spoken errors kept as spoken).
 *
 * - `wer`: word edit distance(actuallySaid, transcript) / wordCount(actuallySaid)
 * - `errorPreservationRate` (0..100):
 *   Of the word positions where `actuallySaid` differs from `meantToSay`,
 *   the percentage (0..100) that `transcript` kept as spoken (`actuallySaid`).
 *   When `actuallySaid` and `meantToSay` have no differing words, returns 100 if `wer === 0`,
 *   otherwise `Math.max(0, Math.round((1 - wer) * 100))`.
 */
export function scoreTranscript(
  meantToSay: string,
  actuallySaid: string,
  transcript: string
): VoiceLabScoreResult {
  const meantWords = normalizeWords(meantToSay);
  const actualWords = normalizeWords(actuallySaid);
  const transcriptWords = normalizeWords(transcript);

  const dist = wordEditDistance(actualWords, transcriptWords);
  const wer =
    actualWords.length === 0
      ? transcriptWords.length === 0
        ? 0
        : 1
      : Number((dist / actualWords.length).toFixed(4));
  const werPercent = Math.round(wer * 100);

  const maxLen = Math.max(actualWords.length, meantWords.length);
  let errorWordsCount = 0;
  let preservedErrorsCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const actualWord = actualWords[i];
    const meantWord = meantWords[i];
    if (actualWord !== meantWord) {
      errorWordsCount++;
      const transcriptWord = transcriptWords[i];
      if (transcriptWord === actualWord) {
        preservedErrorsCount++;
      }
    }
  }

  let errorPreservationRate: number;
  if (errorWordsCount === 0) {
    errorPreservationRate =
      wer === 0 ? 100 : Math.max(0, Math.round((1 - wer) * 100));
  } else {
    errorPreservationRate = Math.round(
      (preservedErrorsCount / errorWordsCount) * 100
    );
  }

  return {
    wer,
    werPercent,
    errorPreservationRate,
    errorWordsCount,
    preservedErrorsCount
  };
}

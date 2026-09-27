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
 * Builds the word-level Levenshtein DP table between `ref` (length m) and `hyp` (length n).
 */
export function buildWordEditDp(ref: string[], hyp: string[]): number[][] {
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

  return dp;
}

/**
 * Computes Levenshtein edit distance between two word arrays.
 */
export function wordEditDistance(ref: string[], hyp: string[]): number {
  const dp = buildWordEditDp(ref, hyp);
  return dp[ref.length][hyp.length];
}

/**
 * Backtraces the Levenshtein DP table to determine which indices in `ref`
 * are aligned to an equal word in `hyp`.
 * Returns a boolean array of length `ref.length` where `true` means `ref[i]`
 * is matched to an identical word in `hyp`.
 */
export function backtraceMatchedRefIndices(
  ref: string[],
  hyp: string[],
  dp: number[][] = buildWordEditDp(ref, hyp)
): boolean[] {
  const matched = new Array<boolean>(ref.length).fill(false);
  let i = ref.length;
  let j = hyp.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      ref[i - 1] === hyp[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      matched[i - 1] = true;
      i--;
      j--;
    } else if (
      i > 0 &&
      j > 0 &&
      ref[i - 1] !== hyp[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1] + 1
    ) {
      matched[i - 1] = false;
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      matched[i - 1] = false;
      i--;
    } else {
      j--;
    }
  }

  return matched;
}

/**
 * Calculates Word Error Rate (WER) of `transcript` vs `actuallySaid` (0 to 1, e.g. 0 = 0%)
 * and alignment-based error-preservation rate (0 to 100%).
 *
 * - Aligns `actuallySaid` <-> `meantToSay` via Levenshtein backtrace; error positions are
 *   the `actuallySaid` word indices not matched to an equal word in `meantToSay`.
 * - Aligns `actuallySaid` <-> `transcript` the same way; an error is preserved when its
 *   `actuallySaid` word index is matched to an equal word in `transcript`.
 */
export function scoreTranscript(
  meantToSay: string,
  actuallySaid: string,
  transcript: string
): VoiceLabScoreResult {
  const meantWords = normalizeWords(meantToSay);
  const actualWords = normalizeWords(actuallySaid);
  const transcriptWords = normalizeWords(transcript);

  const dpActualTranscript = buildWordEditDp(actualWords, transcriptWords);
  const dist = dpActualTranscript[actualWords.length][transcriptWords.length];
  const wer =
    actualWords.length === 0
      ? transcriptWords.length === 0
        ? 0
        : 1
      : Number((dist / actualWords.length).toFixed(4));
  const werPercent = Math.round(wer * 100);

  const matchedAgainstMeant = backtraceMatchedRefIndices(
    actualWords,
    meantWords
  );
  const matchedAgainstTranscript = backtraceMatchedRefIndices(
    actualWords,
    transcriptWords,
    dpActualTranscript
  );

  let errorWordsCount = 0;
  let preservedErrorsCount = 0;

  for (let i = 0; i < actualWords.length; i++) {
    if (!matchedAgainstMeant[i]) {
      errorWordsCount++;
      if (matchedAgainstTranscript[i]) {
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

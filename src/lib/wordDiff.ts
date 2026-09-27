export interface WordDiffPart {
  type: 'same' | 'del' | 'ins';
  text: string;
}

function tokenizeWords(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed.split(/\s+/);
}

/**
 * Computes a case-sensitive word-level LCS diff keeping punctuation attached to words.
 */
export function wordDiff(original: string, corrected: string): WordDiffPart[] {
  const origTokens = tokenizeWords(original);
  const corrTokens = tokenizeWords(corrected);
  const m = origTokens.length;
  const n = corrTokens.length;

  if (m === 0 && n === 0) {
    return [];
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (origTokens[i] === corrTokens[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: WordDiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < m || j < n) {
    if (i < m && j < n && origTokens[i] === corrTokens[j]) {
      result.push({ type: 'same', text: origTokens[i] });
      i += 1;
      j += 1;
    } else if (i < m && (j === n || dp[i + 1][j] >= dp[i][j + 1])) {
      result.push({ type: 'del', text: origTokens[i] });
      i += 1;
    } else {
      result.push({ type: 'ins', text: corrTokens[j] });
      j += 1;
    }
  }

  return result;
}

import { describe, expect, test } from 'vitest';
import { wordDiff } from '../src/lib/wordDiff';

describe('wordDiff (M1c-2 Task 2)', () => {
  test('1. identical strings return all "same" parts with punctuation preserved', () => {
    expect(wordDiff('I dag liker jeg kaffe.', 'I dag liker jeg kaffe.')).toEqual([
      { type: 'same', text: 'I' },
      { type: 'same', text: 'dag' },
      { type: 'same', text: 'liker' },
      { type: 'same', text: 'jeg' },
      { type: 'same', text: 'kaffe.' }
    ]);
  });

  test('2. one replaced word emits "del" and "ins" and is case-sensitive', () => {
    expect(wordDiff('Jeg tenker kaffe,', 'Jeg drikker kaffe,')).toEqual([
      { type: 'same', text: 'Jeg' },
      { type: 'del', text: 'tenker' },
      { type: 'ins', text: 'drikker' },
      { type: 'same', text: 'kaffe,' }
    ]);

    // Case-sensitive check
    expect(wordDiff('jeg liker', 'Jeg liker')).toEqual([
      { type: 'del', text: 'jeg' },
      { type: 'ins', text: 'Jeg' },
      { type: 'same', text: 'liker' }
    ]);
  });

  test('3. an inserted word emits "ins"', () => {
    expect(wordDiff('Det er viktig.', 'Det er svært viktig.')).toEqual([
      { type: 'same', text: 'Det' },
      { type: 'same', text: 'er' },
      { type: 'ins', text: 'svært' },
      { type: 'same', text: 'viktig.' }
    ]);
  });

  test('4. a removed word emits "del"', () => {
    expect(wordDiff('Jeg vil å snakke norsk.', 'Jeg vil snakke norsk.')).toEqual([
      { type: 'same', text: 'Jeg' },
      { type: 'same', text: 'vil' },
      { type: 'del', text: 'å' },
      { type: 'same', text: 'snakke' },
      { type: 'same', text: 'norsk.' }
    ]);
  });

  test('5. empty input returns empty or single-side parts cleanly', () => {
    expect(wordDiff('', '')).toEqual([]);
    expect(wordDiff('   ', '   ')).toEqual([]);
    expect(wordDiff('', 'Hei!')).toEqual([{ type: 'ins', text: 'Hei!' }]);
    expect(wordDiff('Hei!', '')).toEqual([{ type: 'del', text: 'Hei!' }]);
  });
});

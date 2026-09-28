// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import wordsJson from '../data/words/a1-a2.json';
import phrasesJson from '../data/words/phrases.json';
import { WordDatasetSchema, type WordItem } from '../src/lib/words/schema';
import { getVisibleWords, shouldShowDraftWords } from '../src/lib/words/catalog';
import {
  checkStage3Answer,
  checkStage4Answer,
  completeIntroStage,
  createInitialCardState,
  getStage3Hint,
  gradeWordCard,
  isWordKnown,
  updateAdaptiveState,
  type AdaptiveState
} from '../src/lib/words/scheduler';
import {
  buildDailySession,
  countKnownWords,
  createDefaultWordsProgress,
  readWordsProgress,
  writeWordsProgress
} from '../src/lib/words/progress';
import { WordsSession } from '../src/components/words/WordsSession';
import { PathHome } from '../src/components/path/PathHome';
import { writePathPrefs } from '../src/lib/path/storage';
import * as speechModule from '../src/lib/speech';

const catalogWords: WordItem[] = WordDatasetSchema.parse(wordsJson);
const catalogPhrases: WordItem[] = WordDatasetSchema.parse(phrasesJson);

describe('M1f-1 «Слова»: schema, catalog, scheduler, answer checking, storage, and UI stages 1–4', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(speechModule, 'speakNorwegian').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. validates all 300 words and 50 phrases against schema, ensures no duplicate IDs, and verifies 2-3 cloze sentences distinct from examples', () => {
    expect(catalogWords.length).toBe(300);
    expect(catalogPhrases.length).toBe(50);

    const allItems = [...catalogWords, ...catalogPhrases];
    const ids = new Set<string>();
    for (const item of allItems) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      expect(item.status).toBe('draft');
      expect(item.cloze.length).toBeGreaterThanOrEqual(2);
      expect(item.cloze.length).toBeLessThanOrEqual(3);

      const exLower = new Set(item.examples.map((e) => e.nb.trim().toLowerCase()));
      for (const c of item.cloze) {
        expect(c.nb.includes('___')).toBe(true);
        expect(exLower.has(c.nb.trim().toLowerCase())).toBe(false);
        expect(exLower.has(c.nb.replace('___', c.answer).trim().toLowerCase())).toBe(false);
      }
    }
  });

  it('2. hides drafts in production and shows drafts when WORDS_SHOW_DRAFTS=true locally or on Vercel preview', () => {
    const sampleReviewed: WordItem = {
      ...catalogWords[0],
      id: 'w-rev-1',
      status: 'reviewed'
    };
    const sampleDraft: WordItem = {
      ...catalogWords[1],
      id: 'w-draft-1',
      status: 'draft'
    };
    const items = [sampleReviewed, sampleDraft];

    // Production hides drafts even if WORDS_SHOW_DRAFTS is set on production
    expect(
      shouldShowDraftWords({ NODE_ENV: 'production', VERCEL_ENV: 'production', WORDS_SHOW_DRAFTS: 'true' })
    ).toBe(false);
    const prodVisible = getVisibleWords({
      items,
      env: { NODE_ENV: 'production', VERCEL_ENV: 'production' }
    });
    expect(prodVisible.map((i) => i.id)).toEqual(['w-rev-1']);

    // Preview / local with WORDS_SHOW_DRAFTS=true shows both reviewed and draft
    const previewVisible = getVisibleWords({
      items,
      env: { NODE_ENV: 'production', VERCEL_ENV: 'preview', WORDS_SHOW_DRAFTS: 'true' }
    });
    expect(previewVisible.map((i) => i.id)).toEqual(['w-rev-1', 'w-draft-1']);
  });

  it('3. scheduler intervals: good > hard; again brings card back today and drops stage; stage stays in [2, 4] after intro; easy + wrong typed answer moves stage back', () => {
    const now = new Date('2026-09-28T10:00:00Z');
    const baseCard = completeIntroStage(createInitialCardState('w-001', now), now);
    expect(baseCard.stage).toBe(2);

    const afterHard = gradeWordCard(baseCard, 'hard', now);
    const afterGood = gradeWordCard(baseCard, 'good', now);

    expect(new Date(afterGood.fsrsCard.due).getTime()).toBeGreaterThan(
      new Date(afterHard.fsrsCard.due).getTime()
    );
    expect(afterHard.stage).toBe(2);
    expect(afterGood.stage).toBe(3);

    // Stage never goes above 4
    const atStage4 = gradeWordCard(afterGood, 'good', now);
    expect(atStage4.stage).toBe(4);
    const stillStage4 = gradeWordCard(atStage4, 'easy', now);
    expect(stillStage4.stage).toBe(4);

    // "again" resets interval to today and lowers stage (never below 2)
    const droppedFrom4 = gradeWordCard(stillStage4, 'again', now);
    expect(droppedFrom4.stage).toBe(3);
    expect(new Date(droppedFrom4.fsrsCard.due).getTime()).toBeLessThanOrEqual(now.getTime());

    const droppedFrom2 = gradeWordCard(afterHard, 'again', now);
    expect(droppedFrom2.stage).toBe(2);

    // «Легко» followed by a wrong typed answer moves the card back a stage
    const easyAtStage3 = gradeWordCard(baseCard, 'easy', now);
    expect(easyAtStage3.stage).toBe(3);
    expect(easyAtStage3.lastGrade).toBe('easy');

    const movedBack = gradeWordCard(easyAtStage3, 'good', now, { typedCorrect: false });
    expect(movedBack.stage).toBe(2);
  });

  it('4. adaptive rule changes newPerDay and hint fading at >95% and <75% accuracy thresholds, and Known counts only stage >= 4', () => {
    let adaptive: AdaptiveState = {
      newPerDay: 10,
      recentOutcomes: [],
      hintFadeStepOffset: 0
    };

    // 20/20 correct (100% > 95%) -> newPerDay increases by 2 (10 -> 12) and hintFadeStepOffset = 1
    for (let i = 0; i < 20; i++) {
      adaptive = updateAdaptiveState(adaptive, true);
    }
    expect(adaptive.newPerDay).toBe(12);
    expect(adaptive.hintFadeStepOffset).toBe(1);

    // Hint fading progresses faster when hintFadeStepOffset = 1
    const nounItem = catalogWords[0]; // en jobb
    expect(getStage3Hint(nounItem, { stage3Successes: 0 }, { hintFadeStepOffset: 0 }).level).toBe(
      'letter_and_article'
    );
    expect(getStage3Hint(nounItem, { stage3Successes: 0 }, { hintFadeStepOffset: 1 }).level).toBe(
      'article_only'
    );
    expect(getStage3Hint(nounItem, { stage3Successes: 1 }, { hintFadeStepOffset: 1 }).level).toBe(
      'none'
    );

    // 10 wrong answers out of 20 (50% < 75%) -> newPerDay lowers by 2
    let lowAdaptive: AdaptiveState = {
      newPerDay: 10,
      recentOutcomes: Array(19).fill(false),
      hintFadeStepOffset: 1
    };
    lowAdaptive = updateAdaptiveState(lowAdaptive, false);
    expect(lowAdaptive.newPerDay).toBe(8);
    expect(lowAdaptive.hintFadeStepOffset).toBe(0);

    // Known counts only stage >= 4
    expect(isWordKnown({ stage: 1 })).toBe(false);
    expect(isWordKnown({ stage: 2 })).toBe(false);
    expect(isWordKnown({ stage: 3 })).toBe(false);
    expect(isWordKnown({ stage: 4 })).toBe(true);
    expect(isWordKnown({ stage: 5 })).toBe(true);
  });

  it('5. answer checking handles case, extra spaces, noun articles at stage 3, and enforces exact inflected form at stage 4', () => {
    const nounJobb = catalogWords.find((w) => w.lemma === 'jobb')!;
    const nounLonn = catalogWords.find((w) => w.lemma === 'lønn')!;
    const verbJobbe = catalogWords.find((w) => w.lemma === 'jobbe')!;

    // Stage 3 noun requires article or definite form; ignores case and extra spaces
    expect(checkStage3Answer(nounJobb, '  EN   JOBB ').correct).toBe(true);
    expect(checkStage3Answer(nounJobb, 'jobben').correct).toBe(true);
    expect(checkStage3Answer(nounJobb, 'jobb').correct).toBe(false);

    // Feminine noun accepts both ei and en
    expect(checkStage3Answer(nounLonn, 'ei lønn').correct).toBe(true);
    expect(checkStage3Answer(nounLonn, 'en lønn').correct).toBe(true);

    // Stage 4 requires exact form for the cloze gap
    const clozePast = verbJobbe.cloze[0]; // answer: 'jobbet'
    expect(clozePast.answer).toBe('jobbet');
    expect(checkStage4Answer(clozePast, '  JOBBET ').correct).toBe(true);
    expect(checkStage4Answer(clozePast, 'jobber').correct).toBe(false);
    expect(checkStage4Answer(clozePast, 'å jobbe').correct).toBe(false);
  });

  it('6. localStorage resilience: storage that throws does not crash, and progress survives reload', () => {
    const now = new Date('2026-09-28T10:00:00Z');
    const prog = createDefaultWordsProgress();
    prog.cards['w-001'] = {
      ...createInitialCardState('w-001', now),
      stage: 4
    };
    writeWordsProgress(prog);

    const reloaded = readWordsProgress();
    expect(reloaded.cards['w-001']?.stage).toBe(4);
    expect(countKnownWords(reloaded)).toBe(1);

    const plan = buildDailySession(now, catalogWords.slice(0, 15), reloaded);
    expect(plan.dueCards.length).toBe(1);
    expect(plan.newCards.length).toBe(10);

    // Simulate throwing localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => readWordsProgress()).not.toThrow();
    expect(() => writeWordsProgress(prog)).not.toThrow();
  });

  it('7. RTL: renders stages 1, 2, 3, 4, and summary screen, plus updates /path «Мои слова» card', () => {
    const sampleWord = catalogWords.find((w) => w.lemma === 'jobbe')!;
    const now = new Date('2026-09-28T10:00:00Z');

    // First verify Stage 1 -> Stage 2 -> Summary flow with a brand new word
    render(<WordsSession catalog={[sampleWord]} showDrafts={true} />);
    expect(screen.getByTestId('wordsStage1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));

    expect(screen.getByTestId('wordsStage2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Показать ответ' }));
    expect(screen.getByTestId('stage2AnswerBox')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Нормально' }));

    expect(screen.getByTestId('wordsSummary')).toBeTruthy();
    expect(screen.getByTestId('wordsSummaryLine').textContent).toContain(
      'Сегодня: 1 новых, 1 повторено'
    );
    cleanup();
    window.localStorage.clear();

    // Stage 3 -> Stage 4 -> Summary
    const prog = createDefaultWordsProgress();
    prog.cards[sampleWord.id] = {
      ...createInitialCardState(sampleWord.id, now),
      stage: 3
    };
    writeWordsProgress(prog);

    render(<WordsSession catalog={[sampleWord]} showDrafts={true} />);

    // Stage 3: recall the word from Russian translation
    expect(screen.getByTestId('wordsStage3')).toBeTruthy();
    expect(screen.getByTestId('wordsDraftLabel').textContent).toBe(
      'Черновик, проверяется преподавателем'
    );
    expect(screen.getByTestId('stage3Hint').textContent).toContain('å j...');

    const input3 = screen.getByLabelText('Введите слово по-норвежски');
    fireEvent.change(input3, { target: { value: 'å jobbe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(screen.getByTestId('stage3Feedback').textContent).toContain('Верно: å jobbe');
    fireEvent.click(screen.getByRole('button', { name: 'Нормально' }));

    // Summary after 1 due card graded good (stage 3 -> stage 4!)
    expect(screen.getByTestId('wordsSummary')).toBeTruthy();
    expect(screen.getByTestId('wordsSummaryLine').textContent).toContain(
      'Сегодня: 0 новых, 1 повторено, 1 дошли до контекста. Вы знаете 1 из 1 слов'
    );

    // Re-render at Stage 4 to test context cloze and wrong-form feedback
    cleanup();
    const progStage4 = readWordsProgress();
    progStage4.cards[sampleWord.id].fsrsCard.due = new Date(now.getTime() - 1000).toISOString();
    writeWordsProgress(progStage4);

    render(<WordsSession catalog={[sampleWord]} showDrafts={true} />);
    expect(screen.getByTestId('wordsStage4')).toBeTruthy();

    const input4 = screen.getByLabelText('Введите точную форму слова');
    // Type wrong form 'jobber' instead of 'jobbet'
    fireEvent.change(input4, { target: { value: 'jobber' } });
    fireEvent.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(screen.getByTestId('stage4Feedback').textContent).toContain('Нужная форма: jobbet');
    expect(screen.getByTestId('stage4HintL1').textContent).toContain('preteritum');

    // Home card on /path shows «На сегодня: K слов», «Знаю: M», and «Повторить» link to /words
    cleanup();
    writePathPrefs({ onboarded: true });
    render(<PathHome />);
    const wordsCard = document.getElementById('pathWordsCard')!;
    expect(within(wordsCard).getByTestId('wordsKnownCount').textContent).toBe('Знаю: 1');
    const repeatLink = within(wordsCard).getByRole('link', { name: 'Повторить' });
    expect(repeatLink.getAttribute('href')).toBe('/words');
  });
});

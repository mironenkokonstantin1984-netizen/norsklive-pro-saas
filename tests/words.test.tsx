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
  countDueToday,
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

  it('3. scheduler intervals: good > hard; again brings card back today and drops stage; stage stays in [2, 4] after intro; wrong typed answer always grades again', () => {
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

    // Wrong typed answer always becomes 'again', regardless of what button the user pressed
    const goodAtStage3 = gradeWordCard(baseCard, 'good', now);
    expect(goodAtStage3.stage).toBe(3);

    const movedBackFromGood = gradeWordCard(goodAtStage3, 'good', now, { typedCorrect: false });
    expect(movedBackFromGood.stage).toBe(2);
    expect(movedBackFromGood.lastGrade).toBe('again');

    const easyWithWrong = gradeWordCard(goodAtStage3, 'easy', now, { typedCorrect: false });
    expect(easyWithWrong.stage).toBe(2);
    expect(easyWithWrong.lastGrade).toBe('again');
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

    // Known requires stage >= 4 AND contextPassed
    expect(isWordKnown({ stage: 1, contextPassed: false })).toBe(false);
    expect(isWordKnown({ stage: 2, contextPassed: false })).toBe(false);
    expect(isWordKnown({ stage: 3, contextPassed: false })).toBe(false);
    expect(isWordKnown({ stage: 4, contextPassed: false })).toBe(false);
    expect(isWordKnown({ stage: 4, contextPassed: true })).toBe(true);
    expect(isWordKnown({ stage: 5, contextPassed: true })).toBe(true);
  });

  it('4b. contextPassed is set only by a correct stage-4 answer; countDueToday counts visible ids only', () => {
    const now = new Date('2026-09-28T10:00:00Z');
    const stage3 = { ...createInitialCardState('w-001', now), stage: 3 as const };

    // 3 -> 4 via «Нормально» does not make the word known
    const reached4 = gradeWordCard(stage3, 'good', now, { typedCorrect: true });
    expect(reached4.stage).toBe(4);
    expect(reached4.contextPassed).toBe(false);
    expect(isWordKnown(reached4)).toBe(false);

    // wrong stage-4 answer keeps it unknown and drops the stage
    const wrong4 = gradeWordCard(reached4, 'good', now, { typedCorrect: false, clozeIndex: 0, totalClozeCount: 2 });
    expect(wrong4.contextPassed).toBe(false);
    expect(wrong4.stage).toBe(3);

    // correct stage-4 answer sets contextPassed and records the cloze as seen
    const right4 = gradeWordCard(reached4, 'good', now, { typedCorrect: true, clozeIndex: 0, totalClozeCount: 2 });
    expect(right4.contextPassed).toBe(true);
    expect(isWordKnown(right4)).toBe(true);
    expect(right4.seenClozeIndices).toEqual([0]);
    expect(right4.clozeIndex).toBe(1);

    // countDueToday: only visible ids, new ones capped by newPerDay, due cards counted
    const progress = createDefaultWordsProgress();
    progress.adaptive.newPerDay = 2;
    progress.cards['w-due'] = { ...createInitialCardState('w-due', now), stage: 2 };
    progress.cards['w-later'] = {
      ...createInitialCardState('w-later', now),
      stage: 2,
      fsrsCard: { ...createInitialCardState('w-later', now).fsrsCard, due: '2026-10-10T00:00:00Z' }
    };
    expect(countDueToday(now, [], progress)).toBe(0);
    expect(countDueToday(now, ['w-due', 'w-later', 'n1', 'n2', 'n3'], progress)).toBe(3);
    expect(countKnownWords({ ...progress, cards: { a: right4 } }, ['other'])).toBe(0);
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
      stage: 4,
      contextPassed: true
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
      'Новых: 1 · Повторено: 1'
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
    // contextPassed is false until stage 4 is answered correctly, so known = 0
    expect(screen.getByTestId('wordsSummary')).toBeTruthy();
    expect(screen.getByTestId('wordsSummaryLine').textContent).toContain(
      'Дошли до контекста: 1'
    );
    expect(screen.getByTestId('wordsSummaryLine').textContent).toContain(
      'Вы знаете: 0 из 1'
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
    // Wrong answer: only «Дальше» button (grades 'again')
    expect(screen.getByRole('button', { name: 'Дальше' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Нормально' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Легко' })).toBeNull();

    // Home card on /path shows «На сегодня: K слов», «Знаю: M», and «Повторить» link to /words
    cleanup();
    writePathPrefs({ onboarded: true });
    render(<PathHome visibleWordIds={[sampleWord.id]} />);
    const wordsCard = document.getElementById('pathWordsCard')!;
    expect(within(wordsCard).getByTestId('wordsKnownCount').textContent).toBe('Знаю: 0');
    const repeatLink = within(wordsCard).getByRole('link', { name: 'Повторить' });
    expect(repeatLink.getAttribute('href')).toBe('/words');
  });

  it('8. empty state on /words when catalog is empty', () => {
    render(<WordsSession catalog={[]} showDrafts={false} />);
    expect(screen.getByTestId('wordsEmptyState')).toBeTruthy();
    expect(screen.getByText('Слова сейчас проверяет преподаватель. Скоро они появятся здесь')).toBeTruthy();
    const link = within(screen.getByTestId('wordsEmptyState')).getByRole('link', { name: 'Мой путь' });
    expect(link.getAttribute('href')).toBe('/path');
  });

  it('9. guard: at most 5 items share the same first three words in examples and cloze; no translation contains a (...) placeholder', () => {
    const allItems = [...catalogWords, ...catalogPhrases];
    const exStarts: Record<string, number> = {};
    const clozeStarts: Record<string, number> = {};

    for (const item of allItems) {
      for (const ex of item.examples) {
        const start = ex.nb.split(/\s+/).slice(0, 3).join(' ');
        exStarts[start] = (exStarts[start] || 0) + 1;
      }
      for (const c of item.cloze) {
        const start = c.nb.split(/\s+/).slice(0, 3).join(' ');
        clozeStarts[start] = (clozeStarts[start] || 0) + 1;
      }
    }

    for (const [start, count] of Object.entries(exStarts)) {
      expect(count, `Example start "${start}" appears ${count} times (max 5)`).toBeLessThanOrEqual(5);
    }
    for (const [start, count] of Object.entries(clozeStarts)) {
      expect(count, `Cloze start "${start}" appears ${count} times (max 5)`).toBeLessThanOrEqual(5);
    }

    // No translation contains a (...) placeholder
    for (const item of allItems) {
      for (const ex of item.examples) {
        expect(ex.ru, `ru example for ${item.id} "${ex.ru}"`).not.toMatch(/\([^)]+\)/);
        expect(ex.uk, `uk example for ${item.id} "${ex.uk}"`).not.toMatch(/\([^)]+\)/);
        expect(ex.en, `en example for ${item.id} "${ex.en}"`).not.toMatch(/\([^)]+\)/);
      }
    }
  });
});

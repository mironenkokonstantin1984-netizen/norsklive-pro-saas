import { expect, test, type Page } from 'playwright/test';

function installFakeRecognition() {
  type Result = { 0: { transcript: string }; length: number; isFinal: boolean };
  class FakeRecognition {
    lang = '';
    interimResults = false;
    continuous = false;
    onstart: (() => void) | null = null;
    onresult: ((e: { resultIndex: number; results: Result[] }) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    results: Result[] = [];
    constructor() {
      (window as unknown as { __fakeMic: FakeRecognition }).__fakeMic = this;
    }
    start() {
      this.results = [];
      this.onstart?.();
    }
    stop() {
      this.onend?.();
    }
  }
  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
}

function fakeSynthesis(voices: Array<{ name: string; lang: string; localService: boolean }>) {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
      cancel: () => {},
      speak: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  });
}

async function setupBrowserWithNorwegianVoice(page: Page) {
  await page.addInitScript(installFakeRecognition);
  await page.addInitScript(fakeSynthesis, [
    { name: 'Nora', lang: 'nb-NO', localService: true },
    { name: 'Pernille Online', lang: 'nb-NO', localService: false }
  ]);
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
}

async function takeDarkScreenshot(page: Page, path: string) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(100);
  await page.screenshot({ path });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.waitForTimeout(100);
}

test.describe('FeedbackCard & ResultScreen (Issue #54)', () => {
  test('1. FeedbackCard error, expanded, and ok states with screenshots at 390x844', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupBrowserWithNorwegianVoice(page);

    let callCount = 0;
    await page.route('**/api/coach', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reply_norsk: 'Ja, jeg forstår godt hva du mener. Fortell mer om hverdagen din.',
            reply_l1: 'Да, я хорошо понимаю, что ты имеешь в виду.',
            next_hints: [],
            feedback: {
              status: 'has_errors',
              praise_l1: 'Хорошая попытка, основа понятна!',
              level_estimate: 'B1',
              errors: [
                {
                  quote: 'mine familie',
                  fix: 'familien min',
                  type: 'grammar',
                  rule_name_l1: 'Притяжательные местоимения',
                  explanation_l1:
                    'В норвежском языке притяжательное местоимение обычно ставится после существительного в определенной форме: familien min.'
                },
                {
                  quote: 'i helg',
                  fix: 'i helgen',
                  type: 'article',
                  rule_name_l1: 'Определенный артикль времени',
                  explanation_l1: 'В выражениях времени используется определенная форма: i helgen.'
                }
              ],
              better_version: 'Jeg bor i Oslo sammen med familien min.'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reply_norsk: 'Kjempefint! Du snakker veldig bra norsk nå.',
            reply_l1: 'Отлично! Ты сейчас очень хорошо говоришь по-норвежски.',
            next_hints: [],
            feedback: {
              status: 'ok',
              errors: [],
              level_estimate: 'B1',
              praise_l1: 'Отличный порядок слов и точное употребление времен!'
            }
          })
        });
      }
    });

    await page.goto('/practice');
    await expect(page.getByTestId('practiceScreen')).toBeVisible();

    // 1. Submit answer that returns error feedback
    const input = page.locator('#userSpeechInput');
    const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
    await expect(writeBtn).toBeEnabled({ timeout: 10000 });
    await expect(async () => {
      if (!(await input.isVisible())) {
        await writeBtn.click();
      }
      await expect(input).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await input.fill('Jeg bor i Oslo med mine familie.');
    await page.locator('#sendSpeechBtn').click();

    // FeedbackCard should appear and replace microphone dock
    const feedbackCard = page.getByTestId('feedbackCard');
    await expect(feedbackCard).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.practice-dock')).toBeHidden();

    // E2E check (Point 3): «Дальше» is in the viewport at 390x844 right after card appears
    const nextBtn = feedbackCard.getByRole('button', { name: 'Дальше' });
    await expect(nextBtn).toBeVisible();
    const nextBox = await nextBtn.boundingBox();
    expect(nextBox).not.toBeNull();
    if (nextBox) {
      expect(nextBox.y).toBeGreaterThanOrEqual(0);
      expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(844);
    }

    // Check main error, del/ins and rule name
    await expect(feedbackCard.locator('del')).toBeVisible();
    await expect(feedbackCard.locator('ins')).toBeVisible();
    await expect(feedbackCard.getByText('Притяжательные местоимения')).toBeVisible();

    // Take feedback-390x844-error screenshot
    await page.screenshot({ path: 'docs/screenshots/feedback-390x844-error.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/feedback-390x844-error-dark.png');

    // Test «Слушать» button on fix
    const listenFixBtn = page.getByRole('button', { name: 'Слушать исправление' });
    await expect(listenFixBtn).toBeVisible();

    // Expand «Почему?»
    const whyBtn = page.getByRole('button', { name: 'Почему?' });
    await expect(whyBtn).toHaveAttribute('aria-expanded', 'false');
    await whyBtn.click();
    await expect(whyBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText('В норвежском языке притяжательное местоимение обычно ставится после')
    ).toBeVisible();

    // Expand «Ещё 1 замечание»
    const moreBtn = page.getByRole('button', { name: /Ещё 1 замечани/ });
    await moreBtn.click();
    await expect(page.getByText('Определенный артикль времени')).toBeVisible();

    // Expand «Как сказать лучше»
    const betterBtn = page.getByRole('button', { name: 'Как сказать лучше' });
    await betterBtn.click();
    await expect(page.getByText('Jeg bor i Oslo sammen med familien min.')).toBeVisible();

    // E2E check (Point 3): when expanded, «Дальше» stays visible in viewport at 390x844
    const expandedNextBox = await nextBtn.boundingBox();
    expect(expandedNextBox).not.toBeNull();
    if (expandedNextBox) {
      expect(expandedNextBox.y).toBeGreaterThanOrEqual(0);
      expect(expandedNextBox.y + expandedNextBox.height).toBeLessThanOrEqual(844);
    }

    // Take feedback-390x844-expanded screenshot
    await page.screenshot({ path: 'docs/screenshots/feedback-390x844-expanded.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/feedback-390x844-expanded-dark.png');

    // Only one filled button on the card: «Дальше»
    const filledButtons = feedbackCard.locator('.practice-filled-btn');
    await expect(filledButtons).toHaveCount(1);
    await expect(filledButtons).toHaveText('Дальше');

    // Outline button: «Повторить фразу»
    const repeatBtn = feedbackCard.getByRole('button', { name: 'Повторить фразу' });
    await expect(repeatBtn).toBeVisible();

    // Click «Дальше» -> Feedback card closes, dock returns
    await filledButtons.click();
    await expect(feedbackCard).toBeHidden();
    await expect(page.locator('.practice-dock')).toBeVisible();

    // 2. Submit second answer that returns ok feedback
    const writeBtn2 = page.getByRole('button', { name: 'Написать ответ' });
    await expect(writeBtn2).toBeEnabled({ timeout: 10000 });
    await expect(async () => {
      if (!(await input.isVisible())) {
        await writeBtn2.click();
      }
      await expect(input).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await input.fill('Jeg trives veldig godt her i Norge.');
    await page.locator('#sendSpeechBtn').click();

    await expect(feedbackCard).toBeVisible({ timeout: 10000 });
    await expect(feedbackCard.getByText('Хорошо!')).toBeVisible();
    await expect(
      feedbackCard.getByText('Отличный порядок слов и точное употребление времен!')
    ).toBeVisible();

    // E2E check (Point 3): on ok card, «Дальше» is visible in viewport at 390x844
    const okNextBtn = feedbackCard.getByRole('button', { name: 'Дальше' });
    await expect(okNextBtn).toBeVisible();
    const okBox = await okNextBtn.boundingBox();
    expect(okBox).not.toBeNull();
    if (okBox) {
      expect(okBox.y).toBeGreaterThanOrEqual(0);
      expect(okBox.y + okBox.height).toBeLessThanOrEqual(844);
    }

    // Nothing struck out on ok status
    await expect(feedbackCard.locator('del')).toHaveCount(0);

    // Take feedback-390x844-ok screenshot
    await page.screenshot({ path: 'docs/screenshots/feedback-390x844-ok.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/feedback-390x844-ok-dark.png');

    // Click «Дальше»
    await okNextBtn.click();
    await expect(feedbackCard).toBeHidden();
  });

  test('2. Complete session to «Итог» screen: criteria, improve, word deck, and report download', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupBrowserWithNorwegianVoice(page);

    await page.route('**/api/coach', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply_norsk: 'Veldig bra! Hva liker du å gjøre på fritiden?',
          reply_l1: 'Очень хорошо! Чем ты любишь заниматься в свободное время?',
          next_hints: [],
          feedback: {
            status: 'has_errors',
            praise_l1: 'Хороший темп речи!',
            level_estimate: 'B1',
            errors: [
              {
                quote: 'koker mat',
                fix: 'å lage mat',
                type: 'verb_form',
                rule_name_l1: 'Инфинитив с частицей å',
                explanation_l1: 'После глаголов предпочтения используется инфинитив с å: å lage mat.'
              }
            ]
          }
        })
      });
    });

    await page.goto('/practice');

    // Complete 3 answers to have enough data for criteria scores
    for (let i = 0; i < 3; i++) {
      const input = page.locator('#userSpeechInput');
      const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
      await expect(writeBtn).toBeEnabled({ timeout: 10000 });
      await expect(async () => {
        if (!(await input.isVisible())) {
          await writeBtn.click();
        }
        await expect(input).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 10000 });
      await input.fill('Jeg liker kaffe og koker mat.');
      await page.locator('#sendSpeechBtn').click();

      const feedbackCard = page.getByTestId('feedbackCard');
      await expect(feedbackCard).toBeVisible({ timeout: 10000 });
      await feedbackCard.getByRole('button', { name: 'Дальше' }).click();
      await expect(feedbackCard).toBeHidden();
    }

    // Open menu and finish practice
    await page.locator('#materialsToggleBtn').click();
    const finishBtn = page.getByRole('button', { name: 'Завершить практику' });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Verify navigation to /practice/result
    await expect(page).toHaveURL(/\/practice\/result$/);
    const resultScreen = page.getByTestId('practiceResultScreen');
    await expect(resultScreen).toBeVisible();

    // Check heading and orientation note
    await expect(page.getByRole('heading', { level: 1, name: 'Итог практики' })).toBeVisible();
    await expect(
      page.getByText('Оценка ориентировочная, это тренажёр, а не экзамен.')
    ).toBeVisible();

    // Check 4 HK-dir criteria
    await expect(page.getByText('Произношение')).toBeVisible();
    await expect(page.getByText('Словарь')).toBeVisible();
    await expect(page.getByText('Грамматика')).toBeVisible();
    await expect(page.getByText('Взаимодействие')).toBeVisible();

    // Check «Что улучшить»
    await expect(page.getByTestId('resultImprovementsSection')).toBeVisible();
    await expect(page.getByText('Инфинитив с частицей å')).toBeVisible();

    // Check «Слова для повторения» and add to personal deck
    const wordsSection = page.getByTestId('resultWordsSection');
    if (await wordsSection.isVisible()) {
      const addWordBtn = wordsSection.getByRole('button', { name: /Добавить/ }).first();
      await addWordBtn.click();
      await expect(wordsSection.getByText('Добавлено').first()).toBeVisible();
    }

    // Check actions: filled «На главную», outline «Пройти ещё раз», text «Скачать отчёт»
    const primaryBtn = page.locator('.practice-result-primary-btn');
    await expect(primaryBtn).toHaveText('На главную');

    // Point 1 e2e checks: primary button has filled background, main has padding, header has «Итог · <Тема>»
    const primaryBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(primaryBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(primaryBg).not.toBe('transparent');

    const mainPadding = await page.locator('.practice-result-main').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        top: parseFloat(style.paddingTop),
        left: parseFloat(style.paddingLeft),
        bottom: parseFloat(style.paddingBottom),
        right: parseFloat(style.paddingRight)
      };
    });
    expect(mainPadding.top).toBeGreaterThan(0);
    expect(mainPadding.left).toBeGreaterThan(0);

    await expect(page.locator('.practice-header-title')).toHaveText(/^Итог · /);

    const secondaryBtn = page.locator('.practice-result-secondary-btn');
    await expect(secondaryBtn).toHaveText('Пройти ещё раз');

    const downloadBtn = page.locator('.practice-result-download-btn');
    await expect(downloadBtn).toContainText('Скачать отчёт');

    // Take result-390x844 screenshot (light and dark)
    await page.screenshot({ path: 'docs/screenshots/result-390x844.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/result-390x844-dark.png');

    // Test reload persistence (subtask 5)
    await page.reload();
    await expect(resultScreen).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Итог практики' })).toBeVisible();
  });

  test('3. Result screen with too little data shows calm message', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');

    // Directly finish without 3 turns
    await page.locator('#materialsToggleBtn').click();
    await page.getByRole('button', { name: 'Завершить практику' }).click();

    await expect(page).toHaveURL(/\/practice\/result$/);
    await expect(page.getByTestId('tooFewAnswersCard')).toBeVisible();
    await expect(page.getByText('Слишком мало ответов для оценки')).toBeVisible();
  });

  test('4. Redirect to / when visiting /practice/result without session', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/practice/result');
    await expect(page).toHaveURL(/\/$/);
  });

  test('5. Exam mode: no feedback card during exam part, opens итог on finish part', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupBrowserWithNorwegianVoice(page);

    await page.route('**/api/coach', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply_norsk: 'Takk for svaret ditt. La oss fortsette.',
          reply_l1: 'Спасибо за ответ.',
          next_hints: [],
          feedback: {
            status: 'has_errors',
            praise_l1: 'Хорошо.',
            level_estimate: 'B1',
            errors: [
              {
                quote: 'feil ord',
                fix: 'riktig ord',
                type: 'vocabulary',
                rule_name_l1: 'Словарный запас',
                explanation_l1: 'Используйте точное слово.'
              }
            ]
          }
        })
      });
    });

    await page.goto('/practice?mode=exam');
    await expect(page.getByTestId('practiceScreen')).toBeVisible();

    const input = page.locator('#userSpeechInput');
    const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
    await expect(writeBtn).toBeEnabled({ timeout: 10000 });
    await expect(async () => {
      if (!(await input.isVisible())) {
        await writeBtn.click();
      }
      await expect(input).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await input.fill('Jeg svarer på spørsmålet.');
    await page.locator('#sendSpeechBtn').click();

    // In exam mode, FeedbackCard MUST NOT appear
    await page.waitForTimeout(500);
    await expect(page.getByTestId('feedbackCard')).toBeHidden();

    // Finish exam part
    await page.locator('#materialsToggleBtn').click();
    const finishPartBtn = page.getByRole('button', { name: 'Завершить часть' });
    await expect(finishPartBtn).toBeVisible();
    await finishPartBtn.click();

    // Opens result screen for exam part
    await expect(page).toHaveURL(/\/practice\/result$/);
    await expect(page.locator('.practice-header-title')).toHaveText('Итог · Часть 1');
  });
});

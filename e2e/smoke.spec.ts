import { expect, test } from 'playwright/test';

test('main studio flow: skip first-run on /, open /studio via Начать практику, examiner greeting, text answer reply, materials toggle, and zero console errors', async ({
  page
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.route('**/favicon.ico', (route) =>
    route.fulfill({ status: 204, body: '' })
  );

  await page.goto('/');

  // Skip FirstRun on / and click «Начать практику» to go to /studio
  const skipBtn = page.getByRole('button', { name: 'Пропустить' });
  await expect(skipBtn).toBeVisible();
  await skipBtn.click();

  const startPracticeLink = page.getByRole('link', { name: 'Начать практику' });
  await expect(startPracticeLink).toBeVisible();
  await startPracticeLink.click();

  await expect(page).toHaveURL(/\/studio$/);

  // 1. See the examiner's first line and the mic button #micToggleBtn
  const aiMessages = page.locator('#chatStream .msg-ai .msg-norsk');
  await expect(aiMessages.first()).toBeVisible();
  await expect(aiMessages).toHaveCount(1);
  await expect(page.locator('#micToggleBtn')).toBeVisible();

  // 2. Type a Norwegian answer into #userSpeechInput, press #sendSpeechBtn, and wait for a new examiner message
  await page
    .locator('#userSpeechInput')
    .fill('Jeg mener at hjemmekontor gir bedre balanse i hverdagen.');
  await page.locator('#sendSpeechBtn').click();

  await expect(aiMessages).toHaveCount(2, { timeout: 15000 });
  await expect(aiMessages.nth(1)).not.toBeEmpty();

  // 3. Open and close «Материалы» (#materialsToggleBtn, check aria-expanded)
  const materialsBtn = page.locator('#materialsToggleBtn');
  await expect(materialsBtn).toHaveAttribute('aria-expanded', 'false');
  await materialsBtn.click();
  await expect(materialsBtn).toHaveAttribute('aria-expanded', 'true');
  await materialsBtn.click();
  await expect(materialsBtn).toHaveAttribute('aria-expanded', 'false');

  // 4. No console errors during the run
  expect(consoleErrors).toEqual([]);
});

test('/words daily review flow: one new word goes through stage 1 -> stage 2 -> summary', async ({
  page
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'norsklive_words',
      JSON.stringify({
        cards: {},
        adaptive: {
          newPerDay: 1,
          recentOutcomes: [],
          hintFadeStepOffset: 0
        }
      })
    );
  });

  await page.goto('/words');

  // Stage 1: Intro
  await expect(page.getByTestId('wordsStage1')).toBeVisible();
  await page.getByRole('button', { name: 'Дальше' }).click();

  // Stage 2: Recall the meaning
  await expect(page.getByTestId('wordsStage2')).toBeVisible();
  await page.getByRole('button', { name: 'Показать ответ' }).click();
  await expect(page.getByTestId('stage2AnswerBox')).toBeVisible();
  await page.getByRole('button', { name: 'Нормально' }).click();

  // Summary screen
  await expect(page.getByTestId('wordsSummary')).toBeVisible();
  await expect(page.getByTestId('wordsSummaryLine')).toContainText(
    'Новых: 1 · Повторено: 1'
  );
  await expect(page.getByRole('link', { name: 'Вернуться на главную' })).toBeVisible();
});


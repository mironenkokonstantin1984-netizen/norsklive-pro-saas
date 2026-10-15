import { expect, test, type Page } from 'playwright/test';

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
      setTimeout(() => this.onend?.(), 0);
    }
    hear(text: string, final: boolean) {
      const last = this.results[this.results.length - 1];
      if (last && !last.isFinal) this.results.pop();
      this.results.push({ 0: { transcript: text }, length: 1, isFinal: final });
      this.onresult?.({ resultIndex: this.results.length - 1, results: [...this.results] });
    }
    fail(code: string) {
      this.onerror?.({ error: code });
      this.onend?.();
    }
  }
  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
  (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition =
    FakeRecognition;
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

test.describe('Home and Welcome Redesign (Issue #55)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
    await page.addInitScript(fakeSynthesis, [
      { name: 'Nora', lang: 'nb-NO', localService: true },
      { name: 'Pernille Online', lang: 'nb-NO', localService: false }
    ]);
    await page.addInitScript(installFakeRecognition);

    // Default stub for /api/coach
    await page.route('**/api/coach', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const userText = body.userText || '';
      if (userText.includes('feil')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reply_norsk: 'Jeg forstår.',
            reply_l1: 'Я понимаю.',
            feedback: {
              status: 'has_errors',
              praise_l1: 'Хорошая попытка, но есть неточность.',
              level_estimate: 'A2',
              errors: [
                {
                  quote: 'feil',
                  fix: 'riktig',
                  type: 'vocabulary',
                  rule_name_l1: 'Выбор слова',
                  explanation_l1: 'Используйте riktig вместо feil.'
                }
              ]
            },
            next_hints: []
          })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply_norsk: 'Hyggelig å hilse på deg!',
          reply_l1: 'Приятно познакомиться!',
          feedback: {
            status: 'ok',
            praise_l1: 'Отличный ответ! Вы правильно ответили на вопрос.',
            level_estimate: 'A2',
            errors: []
          },
          next_hints: []
        })
      });
    });
  });

  test('welcome flow at 390x844: fresh profile -> steps 1 to 4 -> home within 60s, with screenshots', async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const startTime = Date.now();

    await page.goto('/');

    // 1. Step 1: Language
    const step1Dialog = page.getByRole('dialog');
    await expect(step1Dialog).toBeVisible();
    await expect(page.getByText('1 из 3')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'На каком языке объяснять?' })).toBeVisible();

    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/welcome-390x844-lang.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/welcome-390x844-lang-dark.png');
    }

    await page.getByRole('button', { name: 'Дальше' }).click();

    // 2. Step 2: Level & Exam Date
    await expect(page.getByText('2 из 3')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Цель и дата экзамена' })).toBeVisible();
    await page.locator('#firstRunExamDate').fill('2026-11-20');

    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/welcome-390x844-level.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/welcome-390x844-level-dark.png');
    }

    await page.getByRole('button', { name: 'Дальше' }).click();

    // 3. Step 3: Mini-practice «Знакомство»
    await expect(page.getByText('3 из 3')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Знакомство' })).toBeVisible();
    await expect(page.getByText('«Hva heter du?»')).toBeVisible();

    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/welcome-390x844-intro.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/welcome-390x844-intro-dark.png');
    }

    // Q1: Answer with voice via microphone
    const micBtn = page.getByRole('button', { name: 'Говорить' });
    await expect(micBtn).toBeVisible();
    await micBtn.click();
    await expect(page.getByRole('button', { name: 'Готово' })).toBeVisible();
    await page.evaluate(() => {
      (
        window as unknown as { __fakeMic: { hear: (t: string, f: boolean) => void } }
      ).__fakeMic.hear('Jeg heter Anna', true);
    });
    await page.getByRole('button', { name: 'Готово' }).click();

    const answerInput = page.locator('#firstRunAnswerInput');
    await expect(answerInput).toBeVisible();
    await expect(answerInput).toHaveValue('Jeg heter Anna');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await expect(
      page.getByText('Отличный ответ! Вы правильно ответили на вопрос.')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // Q2: Answer with text toggle
    await expect(page.getByText('«Hvor kommer du fra?»')).toBeVisible();
    const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
    if (await writeBtn.isVisible()) {
      await writeBtn.click();
    }
    await answerInput.fill('Jeg kommer fra Oslo');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // Q3: Answer with text
    await expect(page.getByText('«Hva jobber du med?»')).toBeVisible();
    if (await writeBtn.isVisible()) {
      await writeBtn.click();
    }
    await answerInput.fill('Jeg jobber som lærer');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // 4. Step 4: Summary screen
    await expect(page.getByRole('heading', { name: 'Отличное начало!' })).toBeVisible();
    await expect(page.getByText('Вы сказали три фразы')).toBeVisible();
    await expect(page.getByText('Все 3 ответа приняты без замечаний')).toBeVisible();

    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/welcome-390x844-done.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/welcome-390x844-done-dark.png');
    }

    // Finish welcome flow and go to home
    await page.getByRole('button', { name: 'Перейти на главную' }).click();
    await expect(step1Dialog).not.toBeVisible();

    // Verified Home screen
    await expect(page.getByRole('heading', { name: 'Сегодня: 10 минут практики' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Начать практику' })).toBeVisible();

    // Timing guard: must finish within 60s
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    expect(elapsedSeconds).toBeLessThan(60);

    // Active home screenshot
    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/home-390x844-active.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/home-390x844-active-dark.png');
    }
  });

  test('coach error shows diff and never «Хорошо!», and coach down shows calm message', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Advance to step 3
    await page.getByRole('button', { name: 'Дальше' }).click();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // 1. Submit answer with error
    const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
    if (await writeBtn.isVisible()) {
      await writeBtn.click();
    }
    const answerInput = page.locator('#firstRunAnswerInput');
    await answerInput.fill('Dette er feil');
    await page.getByRole('button', { name: 'Ответить' }).click();

    // Verify error diff appears and «Хорошо!» is NEVER visible
    await expect(page.getByText('Разбор ответа')).toBeVisible();
    await expect(page.locator('del.practice-del')).toHaveText('feil');
    await expect(page.locator('ins.practice-ins')).toHaveText('riktig');
    await expect(page.getByText('Хорошо!')).not.toBeVisible();

    // Click «Дальше» to advance to Q2
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByText('«Hvor kommer du fra?»')).toBeVisible();

    // 2. Re-route /api/coach to 503 (coach down)
    await page.route('**/api/coach', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'coach_unavailable' })
      });
    });

    if (await writeBtn.isVisible()) {
      await writeBtn.click();
    }
    await answerInput.fill('Jeg kommer fra Oslo');
    await page.getByRole('button', { name: 'Ответить' }).click();

    // Verify calm card appears and «Хорошо!» is NEVER visible
    await expect(page.getByText('Ответ принят', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Ответ принят. Разбор покажем, когда сервис проверки будет доступен.')
    ).toBeVisible();
    await expect(page.getByText('Хорошо!')).not.toBeVisible();

    // Advance to Q3
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByText('«Hva jobber du med?»')).toBeVisible();
  });

  test('skipping welcome shows resume card on home, with new-home screenshots', async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const skipBtn = page.getByRole('button', { name: 'Пропустить' });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // Home is visible with resume card
    await expect(page.getByRole('heading', { name: 'Сегодня: 10 минут практики' })).toBeVisible();
    const resumeHeading = page.getByRole('heading', { name: 'Пройти знакомство' });
    await expect(resumeHeading).toBeVisible();

    if (testInfo.project.name === 'phone') {
      await page.screenshot({ path: 'docs/screenshots/home-390x844-new.png' });
      await takeDarkScreenshot(page, 'docs/screenshots/home-390x844-new-dark.png');
    }

    // Dismissing resume card hides it
    await page.getByRole('button', { name: 'Скрыть' }).click();
    await expect(resumeHeading).not.toBeVisible();
  });
});

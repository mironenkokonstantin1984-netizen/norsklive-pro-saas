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

    // Answer Q1
    const answerInput = page.locator('#firstRunAnswerInput');
    await answerInput.fill('Jeg heter Anna');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // Answer Q2
    await expect(page.getByText('«Hvor kommer du fra?»')).toBeVisible();
    await answerInput.fill('Jeg kommer fra Oslo');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // Answer Q3
    await expect(page.getByText('«Hva jobber du med?»')).toBeVisible();
    await answerInput.fill('Jeg jobber som lærer');
    await page.getByRole('button', { name: 'Ответить' }).click();
    await expect(page.getByText('Хорошо!')).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();

    // 4. Step 4: Summary screen
    await expect(page.getByRole('heading', { name: 'Отличное начало!' })).toBeVisible();
    await expect(page.getByText('Вы сказали три фразы')).toBeVisible();

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

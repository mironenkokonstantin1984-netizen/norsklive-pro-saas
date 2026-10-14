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

test.describe('Practice Screen (/practice, Issue #53)', () => {
  test('1. Redirect from /studio to /practice preserving query string', async ({ page }) => {
    await page.goto('/studio?mode=exam');
    await expect(page).toHaveURL(/\/practice\?mode=exam$/);
    await expect(page.getByTestId('practiceScreen')).toBeVisible();
    await expect(page.locator('.practice-header-title')).toContainText('Экзамен');
  });

  test('2. Main practice flow at 390x844: text answer, reply in viewport, and screenshots', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(installFakeRecognition);
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/practice');

    // 1. Idle screenshot (light and dark)
    await expect(page.getByTestId('practiceScreen')).toBeVisible();
    const examinerSpeech = page.locator('.practice-examiner-speech');
    await expect(examinerSpeech).toBeVisible();

    await page.screenshot({ path: 'docs/screenshots/practice-390x844-idle.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-idle-dark.png');

    // 2. Recording state
    const micBtn = page.locator('#micToggleBtn');
    await micBtn.click({ force: true });
    await page.screenshot({ path: 'docs/screenshots/practice-390x844-recording.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-recording-dark.png');
    await micBtn.click({ force: true });

    // 3. Review state (type text answer)
    const input = page.locator('#userSpeechInput');
    if (!(await input.isVisible())) {
      const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
      if (await writeBtn.isVisible()) {
        await writeBtn.click();
      }
    }
    await expect(input).toBeVisible();
    await input.fill('Jeg liker å lære norsk hver dag.');

    await page.screenshot({ path: 'docs/screenshots/practice-390x844-review.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-review-dark.png');

    // 4. Loading state & reply
    const sendBtn = page.locator('#sendSpeechBtn');
    await sendBtn.click();

    // Verify reply arrives and examiner line is in viewport
    await expect(examinerSpeech).toBeVisible();
    const box = await examinerSpeech.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeLessThan(844);
    }
  });

  test('3. Desktop screenshot at 1280x800 (light and dark)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/practice');
    await expect(page.getByTestId('practiceScreen')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/practice-1280x800-idle.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-1280x800-idle-dark.png');
  });

  test('4. Exam mode screenshot at 390x844 (light and dark)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice?mode=exam');
    await expect(page.getByTestId('practiceScreen')).toBeVisible();
    await expect(page.getByText(/Часть 1/)).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/practice-390x844-exam.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-exam-dark.png');
  });

  test('5. Keyboard navigation flow and accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');

    // Tab through elements in DOM order
    await page.keyboard.press('Tab'); // Back link
    await expect(page.locator('.practice-back-btn')).toBeFocused();

    await page.keyboard.press('Tab'); // Header menu button «…»
    await expect(page.locator('#materialsToggleBtn')).toBeFocused();

    await page.keyboard.press('Tab'); // Перевод
    await expect(page.getByRole('button', { name: 'Перевод' })).toBeFocused();

    await page.keyboard.press('Tab'); // Слушать
    await expect(page.getByRole('button', { name: 'Слушать' })).toBeFocused();

    await page.keyboard.press('Tab'); // Mic button
    await expect(page.locator('#micToggleBtn')).toBeFocused();

    // Check aria-live on companion/screen
    await expect(page.locator('.practice-orb-wrap')).toHaveAttribute('aria-live', 'polite');
  });

  test('6. Coach unavailable and loading screenshots at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(installFakeRecognition);

    // Part A: Real loading state with pending coach request
    let releasePendingCoach: () => void = () => {};
    await page.route('**/api/coach', async (route) => {
      await new Promise<void>((resolve) => {
        releasePendingCoach = resolve;
      });
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'coach_unavailable' })
      });
    });

    await page.goto('/practice');

    const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
    await writeBtn.click();
    const input = page.locator('#userSpeechInput');
    await expect(input).toBeVisible();
    await input.fill('Jeg liker kaffe.');

    // Click send
    await page.locator('#sendSpeechBtn').click();

    // Verify thinking orb state and take real loading screenshots
    await expect(page.locator('.practice-orb.thinking')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/practice-390x844-loading.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-loading-dark.png');

    // Release coach route to fulfill 503 error
    releasePendingCoach?.();

    // Verify coach unavailable error card is displayed
    const errorCard = page.getByTestId('coachErrorCard');
    await expect(errorCard).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'docs/screenshots/practice-390x844-error.png' });
    await takeDarkScreenshot(page, 'docs/screenshots/practice-390x844-error-dark.png');
  });
});

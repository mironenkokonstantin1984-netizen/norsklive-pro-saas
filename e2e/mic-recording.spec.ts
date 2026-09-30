import { expect, test, type Page } from 'playwright/test';

/**
 * A fake browser recognizer driven from the test through `window.__fakeMic`.
 * Real speech recognition needs a microphone and Google's servers, so it is replaced here.
 */
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

async function openStudio(page: Page) {
  await page.addInitScript(installFakeRecognition);
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
}

async function hear(page: Page, text: string, final = true) {
  await page.evaluate(
    ([t, f]) =>
      (
        window as unknown as { __fakeMic: { hear: (t: string, f: boolean) => void } }
      ).__fakeMic.hear(t as string, f as boolean),
    [text, final]
  );
}

test('records until «Готово», then lets the learner review before sending', async ({
  page
}, testInfo) => {
  await openStudio(page);
  const mic = page.locator('#micToggleBtn');
  const input = page.locator('#userSpeechInput');

  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#micButtonLabel')).toHaveText('Готово');

  await hear(page, 'Jeg heter Anna og jeg bor i Bergen.');
  // The browser ends the session at a pause; the recording goes on.
  await page.evaluate(() =>
    (window as unknown as { __fakeMic: { onend: () => void } }).__fakeMic.onend()
  );
  await hear(page, 'Jeg jobber på et sykehus', false);
  await expect(page.locator('#micLiveText')).toHaveText(
    'Jeg heter Anna og jeg bor i Bergen. Jeg jobber på et sykehus'
  );
  await expect(mic).toHaveAttribute('aria-pressed', 'true');

  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/mic-recording-390x844.png' });
  }

  await hear(page, 'Jeg jobber på et sykehus.');
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'false');
  await expect(input).toHaveValue('Jeg heter Anna og jeg bor i Bergen. Jeg jobber på et sykehus.');
  // Nothing was sent: only the greeting is in the chat.
  await expect(page.locator('#chatStream .msg-user')).toHaveCount(0);
  await expect(input).toBeFocused();

  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/mic-review-390x844.png' });
  }

  await page.locator('#sendSpeechBtn').click();
  await expect(page.locator('#chatStream .msg-user')).toHaveCount(1);
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
});

test('a denied microphone shows a plain message and the learner can still type', async ({
  page
}, testInfo) => {
  await openStudio(page);
  await page.locator('#micToggleBtn').click();
  await page.evaluate(() =>
    (window as unknown as { __fakeMic: { fail: (c: string) => void } }).__fakeMic.fail(
      'not-allowed'
    )
  );

  const status = page.locator('#micStatusText');
  await expect(status).toHaveText(
    'Нет доступа к микрофону. Разрешите его в настройках браузера или напишите ответ.'
  );
  await expect(status).not.toContainText('not-allowed');

  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/mic-error-390x844.png' });
  }

  await page.locator('#userSpeechInput').fill('Jeg bor i Bergen.');
  await page.locator('#sendSpeechBtn').click();
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
});

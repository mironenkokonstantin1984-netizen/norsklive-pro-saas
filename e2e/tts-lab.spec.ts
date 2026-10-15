import { expect, test } from 'playwright/test';

function fakeSynthesis(voices: Array<{ name: string; lang: string; localService: boolean }>) {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
      cancel: () => {},
      speak: (utter: SpeechSynthesisUtterance) => {
        setTimeout(() => utter?.onstart?.(new Event('start') as SpeechSynthesisEvent), 10);
        setTimeout(() => utter?.onend?.(new Event('end') as SpeechSynthesisEvent), 50);
      },
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  });
}

test.describe('TTS Lab bake-off (/lab/voice)', () => {
  test('renders TTS lab without keys and captures screenshots at 390x844', async ({
    page
  }, testInfo) => {
    test.setTimeout(60000);
    test.skip(testInfo.project.name !== 'phone', 'Only applies to phone project (390x844)');

    await page.addInitScript(fakeSynthesis, [
      { name: 'Nora', lang: 'nb-NO', localService: true },
      { name: 'Pernille Online', lang: 'nb-NO', localService: false }
    ]);
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/lab/voice', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: 'Синтез речи (TTS)' })).toBeVisible();

    // Switch to TTS tab
    await page.getByRole('tab', { name: 'Синтез речи (TTS)' }).click();
    await expect(
      page.getByText('Сравнение нейроголосов: эталон браузера активен')
    ).toBeVisible();

    // Screenshot 1: Tab without keys (calm explanation, browser baseline active)
    await page.screenshot({ path: 'docs/screenshots/tts-lab-390x844-nokeys.png' });

    // Click "Сгенерировать и воспроизвести"
    const synthesizeBtn = page.getByRole('button', {
      name: 'Сгенерировать и воспроизвести'
    });
    await synthesizeBtn.click();

    // Wait for the clip card to appear
    const clipCard = page.getByTestId('ttsClipCard');
    await expect(clipCard).toBeVisible();
    await expect(clipCard).toContainText('Браузер');

    // Scroll so the cost table with the browser baseline row is visible
    await page
      .getByRole('heading', { name: 'Оценка стоимости и калькулятор сессии' })
      .scrollIntoViewIfNeeded();

    // Screenshot 2: Light theme, browser voice generated and visible
    await page.screenshot({ path: 'docs/screenshots/tts-lab-390x844-browser.png' });
  });
});

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

async function openStudio(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/(studio|practice)$/);
}

test('the learner sees the examiner voice and can test it', async ({ page }, testInfo) => {
  await page.addInitScript(fakeSynthesis, [
    { name: 'Nora', lang: 'nb-NO', localService: true },
    { name: 'Pernille Online', lang: 'nb-NO', localService: false }
  ]);
  await page.goto('/profile');
  await expect(page.getByText(/нет норвежского голоса/)).toHaveCount(0);
  const testVoiceBtn = page.getByRole('button', { name: 'Проверить голос' });
  await expect(testVoiceBtn).toBeVisible();
  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/voice-settings-390x844.png' });
  }
});

test('a device without a Norwegian voice says so and explains what to do', async ({
  page
}, testInfo) => {
  await page.addInitScript(fakeSynthesis, [{ name: 'Svenska', lang: 'sv-SE', localService: true }]);
  await openStudio(page);
  const notice = page.getByRole('status', { name: 'Голос экзаменатора' });
  await expect(notice).toContainText('нет норвежского голоса', { timeout: 5000 });
  await notice.getByRole('button', { name: 'Как включить' }).click();
  await expect(notice).toContainText('Android');
  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/voice-no-norwegian-390x844.png' });
  }
  await notice.getByRole('button', { name: 'Понятно' }).click();
  await expect(notice).toHaveCount(0);
});

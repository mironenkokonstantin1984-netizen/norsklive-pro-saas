import { expect, test, type Page } from 'playwright/test';

async function openStudio(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
}

test('when the coach is unavailable the learner sees an honest card and can retry', async ({
  page
}, testInfo) => {
  let calls = 0;
  await page.route('**/api/coach', async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'coach_unavailable' })
      });
      return;
    }
    await route.continue();
  });

  await openStudio(page);
  await page.locator('#userSpeechInput').fill('Jeg bor i Bergen.');
  await page.locator('#sendSpeechBtn').click();

  const card = page.getByTestId('coachErrorCard');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Не получилось получить ответ. Ваш ответ сохранён.');
  await expect(page.locator('#chatStream .correction-card')).toHaveCount(0);
  await expect(page.locator('#chatStream .msg-user')).toHaveCount(1);

  if (testInfo.project.name === 'phone') {
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/screenshots/coach-unavailable-390x844-light.png' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/coach-unavailable-390x844-dark.png' });
    await page.emulateMedia({ colorScheme: 'light' });
  }

  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
  await expect(card).toHaveCount(0);
  await expect(page.locator('#chatStream .msg-user')).toHaveCount(1);
  // e2e runs without a real AI key, so the retried answer is a labelled example.
  await expect(page.getByTestId('exampleAnswerLabel')).toBeVisible();
});

import { expect, test } from 'playwright/test';

test('main studio flow: examiner greeting, text answer reply, materials toggle, and zero console errors', async ({
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

  // 1. See the examiner's first line and the mic button #micToggleBtn
  const aiMessages = page.locator('#chatStream .msg-ai .msg-norsk');
  await expect(aiMessages.first()).toBeVisible();
  await expect(aiMessages).toHaveCount(1);
  await expect(page.locator('#micToggleBtn')).toBeVisible();

  // 2. Type a Norwegian answer into #userSpeechInput, press #sendSpeechBtn, and wait for a new examiner message
  await page.locator('#userSpeechInput').fill('Jeg mener at hjemmekontor gir bedre balanse i hverdagen.');
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

import { expect, test, type Page } from 'playwright/test';

async function openStudio(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
}

async function sendReply(page: Page) {
  const aiMessages = page.locator('#chatStream .msg-ai');
  await page.locator('#userSpeechInput').fill('Jeg bor i Bergen og jobber på et sykehus.');
  await page.locator('#sendSpeechBtn').click();
  await expect(aiMessages).toHaveCount(2, { timeout: 15000 });
}

/** The start of the newest examiner reply lies between the sticky top bar and the fixed mic dock. */
async function expectNewestReplyVisible(page: Page) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const replies = document.querySelectorAll('#chatStream .msg-ai');
          const last = replies[replies.length - 1];
          const topbar = document.querySelector('.topbar');
          const dock = document.querySelector('.voice-dock');
          if (!last || !topbar || !dock) return false;
          const top = last.getBoundingClientRect().top;
          return (
            top >= topbar.getBoundingClientRect().bottom - 1 &&
            top < dock.getBoundingClientRect().top
          );
        }),
      { timeout: 5000 }
    )
    .toBe(true);
}

test('after sending, the newest examiner reply is visible above the mic dock', async ({ page }) => {
  await openStudio(page);
  await sendReply(page);
  await expectNewestReplyVisible(page);

  const size = page.viewportSize();
  if (size) {
    await page.screenshot({
      path: `docs/screenshots/chat-scroll-${size.width}x${size.height}-after-send.png`
    });
  }
});

test.describe('laptop 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('newest reply is visible after sending', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one run is enough');
    await openStudio(page);
    await sendReply(page);
    await expectNewestReplyVisible(page);
    await page.screenshot({ path: 'docs/screenshots/chat-scroll-1280x800-after-send.png' });
  });
});

test('a learner who scrolls up while waiting is not pulled down; «Новые сообщения» brings them back', async ({
  page
}) => {
  await openStudio(page);
  await sendReply(page);
  await expectNewestReplyVisible(page);

  // Slow the next coach answer down so the learner can scroll up while waiting.
  await page.route('**/api/coach', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });

  await page.locator('#userSpeechInput').fill('Jeg liker å gå tur i skogen.');
  await page.locator('#sendSpeechBtn').click();
  await page.waitForTimeout(300);
  await page.mouse.move(100, 300);
  await page.mouse.wheel(0, -5000);

  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(3, { timeout: 15000 });
  const newMessagesBtn = page.getByRole('button', { name: 'Новые сообщения' });
  await expect(newMessagesBtn).toBeVisible();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThan(50);

  await newMessagesBtn.click();
  await expectNewestReplyVisible(page);
  await expect(newMessagesBtn).toHaveCount(0);
});

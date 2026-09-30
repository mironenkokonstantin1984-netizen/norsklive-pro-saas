import { expect, test, type Page } from 'playwright/test';

async function openStudio(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
}

test('the studio does not request the Inter font', async ({ page }) => {
  const fontRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('fonts.googleapis.com') || /inter/i.test(new URL(url).pathname)) {
      fontRequests.push(url);
    }
  });
  await openStudio(page);
  await page.reload();
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
  expect(fontRequests).toEqual([]);
});

test('each page has its own title, lang="ru" and one h1', async ({ page }) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));

  await page.goto('/login');
  await expect(page).toHaveTitle('Вход · NorskLive');
  await expect(page.locator('h1')).toHaveCount(1);

  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await expect(page).toHaveTitle('Мой путь · NorskLive');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('h1')).toHaveCount(1);

  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveTitle('Практика · NorskLive');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('keyboard focus shows a 2 px ring in the primary colour', async ({ page }, testInfo) => {
  await openStudio(page);
  await page.locator('#userSpeechInput').focus();
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    const probe = document.createElement('span');
    probe.style.color = 'var(--primary)';
    document.body.appendChild(probe);
    const primary = getComputedStyle(probe).color;
    probe.remove();
    return {
      id: el.id,
      width: style.outlineWidth,
      styleName: style.outlineStyle,
      offset: style.outlineOffset,
      color: style.outlineColor,
      primary
    };
  });
  expect(ring.id).toBe('sendSpeechBtn');
  expect(ring.width).toBe('2px');
  expect(ring.styleName).toBe('solid');
  expect(ring.offset).toBe('2px');
  expect(ring.color).toBe(ring.primary);

  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/quickwins-390x844-focus.png' });
  }
});

test('studio at 390×844', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'screenshot for the phone only');
  await openStudio(page);
  await page.locator('#userSpeechInput').fill('Jeg bor i Bergen.');
  await page.locator('#sendSpeechBtn').click();
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screenshots/quickwins-390x844-studio.png' });
});

import { expect, test, type Page } from 'playwright/test';

const MIN = 44;

/** Visible buttons, inputs, selects and textareas smaller than 44 px in either direction. */
async function smallControls(page: Page) {
  return page.evaluate((min) => {
    const found: string[] = [];
    const controls = document.querySelectorAll<HTMLElement>(
      'button, input:not([type="hidden"]), select, textarea'
    );
    for (const el of controls) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      // A visually hidden input inside a label is measured through its label.
      const target =
        (el instanceof HTMLInputElement && (rect.width <= 1 || rect.height <= 1)
          ? el.closest('label')
          : el) ?? el;
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.height < min - 0.5 || r.width < min - 0.5) {
        const name =
          target.getAttribute('aria-label') ||
          target.id ||
          (target.textContent || '').trim().slice(0, 30) ||
          target.tagName;
        found.push(`${name} (${Math.round(r.width)}×${Math.round(r.height)})`);
      }
    }
    return found;
  }, MIN);
}

test.describe('touch targets at 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'measured once, on the phone project');
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  });

  test('first run on / has no control under 44 px', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Пропустить' })).toBeVisible();
    expect(await smallControls(page)).toEqual([]);
  });

  test('home on / has no control under 44 px', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Пропустить' }).click();
    await expect(page.getByRole('link', { name: 'Начать практику' })).toBeVisible();
    expect(await smallControls(page)).toEqual([]);
  });

  test('/studio has no control under 44 px, also with «Материалы» open and after an answer', async ({
    page
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Пропустить' }).click();
    await page.getByRole('link', { name: 'Начать практику' }).click();
    await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
    expect(await smallControls(page)).toEqual([]);

    await page.locator('#userSpeechInput').fill('Jeg bor i Bergen.');
    await page.locator('#sendSpeechBtn').click();
    await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
    expect(await smallControls(page)).toEqual([]);

    await page.locator('.materials-toggle-btn').click();
    expect(await smallControls(page)).toEqual([]);
  });

  test('/login has no control under 44 px', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    expect(await smallControls(page)).toEqual([]);
  });
});

import { test, expect } from 'playwright/test';

test.describe('Profile Page E2E (Issue #56)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'norsklive_path',
        JSON.stringify({
          l1: 'ru',
          targetLevel: 'B1',
          examDate: '2026-11-20',
          selectedTopic: 'arbeid',
          onboarded: true
        })
      );
      window.localStorage.setItem(
        'norsklive_prefs',
        JSON.stringify({
          textSize: 'sm',
          tempo: 1.0,
          subtitles: true,
          contrast: false,
          examMode: false,
          autoSend: false
        })
      );
    });
  });

  test('1. Navigation from home header profile button to /profile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const profileBtn = page.locator('.path-profile-btn');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Профиль' })).toBeVisible();
  });

  test('2. Toggles settings, persists to localStorage, and survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile');

    // 1. Language & Level
    const levelA2 = page.locator('button[data-level="A2"]');
    await expect(levelA2).toBeVisible();
    await levelA2.click();
    await expect(levelA2).toHaveAttribute('aria-checked', 'true');

    const l1Uk = page.locator('button[data-l1="uk"]');
    await expect(l1Uk).toBeVisible();
    await l1Uk.click();
    await expect(l1Uk).toHaveAttribute('aria-checked', 'true');

    // 2. Practice (autoSend)
    const autoSendSwitch = page.locator('#autoSendSwitch');
    await expect(autoSendSwitch).toHaveAttribute('aria-checked', 'false');
    await autoSendSwitch.click();
    await expect(autoSendSwitch).toHaveAttribute('aria-checked', 'true');

    // 3. Voice (tempo & subtitles)
    const tempo08 = page.locator('button[data-tempo="0.8"]');
    await tempo08.click();
    await expect(tempo08).toHaveAttribute('aria-checked', 'true');

    const subtitlesSwitch = page.locator('#subtitlesSwitch');
    await expect(subtitlesSwitch).toHaveAttribute('aria-checked', 'true');
    await subtitlesSwitch.click();
    await expect(subtitlesSwitch).toHaveAttribute('aria-checked', 'false');

    // 4. View (contrast, text size, theme)
    const contrastSwitch = page.locator('#contrastSwitch');
    await expect(contrastSwitch).toHaveAttribute('aria-checked', 'false');
    await contrastSwitch.click();
    await expect(contrastSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'true');

    const textSizeMd = page.locator('button[data-size="md"]');
    await textSizeMd.click();
    await expect(textSizeMd).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'md');

    const darkThemeBtn = page.locator('button[data-theme="dark"]');
    await darkThemeBtn.click();
    await expect(darkThemeBtn).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reload and verify persistence
    await page.reload();

    await expect(page.locator('button[data-level="A2"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('button[data-l1="uk"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#autoSendSwitch')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('button[data-tempo="0.8"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#subtitlesSwitch')).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('#contrastSwitch')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('button[data-size="md"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('button[data-theme="dark"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('3. No horizontal scroll at 390x844 and no links to lab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile');

    // Verify no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Verify no links to /lab
    const labLinks = page.locator('a[href*="/lab"]');
    expect(await labLinks.count()).toBe(0);

    // Verify disabled delete account with «Скоро»
    const deleteBtn = page.locator('.profile-delete-btn');
    await expect(deleteBtn).toBeDisabled();
    await expect(deleteBtn).toContainText('Скоро');
  });
});

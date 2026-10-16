import { test, expect } from 'playwright/test';

test.describe('TopicSheet E2E (Issue #56)', () => {
  test.beforeEach(async ({ page }) => {
    // Mark user as onboarded so home renders PathHome directly
    await page.addInitScript(() => {
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
    });
  });

  test('1. Open from home and select a topic', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const changeTopicBtn = page.locator('.path-topic-change-btn');
    await expect(changeTopicBtn).toBeVisible();
    await changeTopicBtn.click();

    const sheet = page.locator('.topic-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('role', 'dialog');

    // Select "Жильё" (bolig)
    const boligBtn = sheet.locator('button[data-topic="bolig"]');
    await expect(boligBtn).toBeVisible();
    await boligBtn.click();

    // Sheet closes and topic row updates
    await expect(sheet).toBeHidden();
    await expect(page.locator('.path-topic-label')).toContainText('Жильё');
  });

  test('2. Open from /practice header title, switch mode and close with Esc', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');

    const titleBtn = page.locator('.practice-header-title-btn');
    await expect(titleBtn).toBeVisible();
    await titleBtn.click();

    const sheet = page.locator('.topic-sheet');
    await expect(sheet).toBeVisible();

    // Switch mode control to Экзамен
    const examBtn = sheet.getByRole('radio', { name: 'Экзамен' });
    await expect(examBtn).toBeVisible();
    await examBtn.click();
    await expect(examBtn).toHaveAttribute('aria-checked', 'true');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    // Focus returns to the title button
    await expect(titleBtn).toBeFocused();
  });

  test('3. Close by clicking overlay/scrim', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');

    const titleBtn = page.locator('.practice-header-title-btn');
    await titleBtn.click();

    const sheet = page.locator('.topic-sheet');
    await expect(sheet).toBeVisible();

    // Click backdrop scrim outside sheet content
    const backdrop = page.locator('.topic-sheet-backdrop');
    await backdrop.click({ position: { x: 20, y: 50 } });
    await expect(sheet).toBeHidden();
  });

  test('4. Custom topic with long text (3 000+ characters)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice');

    const titleBtn = page.locator('.practice-header-title-btn');
    await titleBtn.click();

    const sheet = page.locator('.topic-sheet');
    await expect(sheet).toBeVisible();

    // Fill in custom topic textarea
    const customToggle = sheet.locator('.topic-custom-toggle-btn');
    await expect(customToggle).toBeVisible();
    // Expand if collapsed
    if ((await customToggle.getAttribute('aria-expanded')) !== 'true') {
      await customToggle.click();
    }

    const textarea = sheet.locator('#topicCustomText');
    await expect(textarea).toBeVisible();

    // Generate 3 200 character text
    const longText = 'Norsk arbeidsliv legger stor vekt på samarbeid og tillit. '.repeat(55);
    expect(longText.length).toBeGreaterThan(3000);

    await textarea.fill(longText);

    // Counter updates
    const counter = sheet.locator('.topic-custom-counter');
    await expect(counter).toContainText(`${longText.length} / 4000`);

    // Submit custom topic
    const submitBtn = sheet.locator('.topic-custom-apply-btn');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Sheet closes and title button reflects custom scenario
    await expect(sheet).toBeHidden();
    await expect(titleBtn).toContainText('Своя тема');
  });
});

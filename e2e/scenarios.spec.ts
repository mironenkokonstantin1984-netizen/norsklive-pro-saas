import { expect, test, type Page } from 'playwright/test';

async function openStudio(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/(studio|practice)$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
}

test('captures mobile screenshots for presentation, picture, and conversation tasks', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'Mobile screenshots test only applies to phone project');
  await openStudio(page);

  // 1. Presentation task (default first scenario)
  await expect(page.locator('#chatStream .msg-ai').first()).toContainText(
    'Vi begynner med en kort presentasjon'
  );

  if (testInfo.project.name === 'phone') {
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/scenario-390x844-presentation.png' });
  }

  // 2. Picture task: select picture scenario
  const materialsBtn = page.locator('#materialsToggleBtn');
  await expect(materialsBtn).toBeVisible();
  await page.waitForTimeout(300);
  await materialsBtn.click();
  await expect(page.locator('#materialsDrawer')).toHaveClass(/is-open/);

  const pictureCard = page.locator('.scenario-item', {
    hasText: 'Bildebeskrivelse: Arbeidsplassen og trivsel'
  });
  await expect(pictureCard).toBeVisible();
  await pictureCard.click();

  // Close materials drawer to view the conversation
  await materialsBtn.click();
  await expect(page.locator('#materialsDrawer')).toHaveClass(/is-closed/);

  await expect(page.locator('[data-testid="scenarioImageWrapper"]')).toBeVisible();
  const svg = page.locator('[data-testid="scenarioImageWrapper"] svg');
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute('role', 'img');

  // Verify that the inline SVG resolves CSS variables and does not render as a black box
  const bgRectFill = await svg.locator('rect').first().evaluate((el) => {
    return window.getComputedStyle(el).fill;
  });
  expect(bgRectFill).not.toBe('rgb(0, 0, 0)');
  expect(bgRectFill).not.toBe('#000000');
  expect(bgRectFill).not.toBe('black');

  if (testInfo.project.name === 'phone') {
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/scenario-390x844-picture.png' });

    // Dark-theme screenshot and non-black verification
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    const darkBgFill = await svg.locator('rect').first().evaluate((el) => {
      return window.getComputedStyle(el).fill;
    });
    expect(darkBgFill).not.toBe('rgb(0, 0, 0)');
    expect(darkBgFill).not.toBe('#000000');
    expect(darkBgFill).not.toBe('black');
    await page.screenshot({ path: 'docs/screenshots/scenario-390x844-picture-dark.png' });

    // Restore default theme
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
  }

  // 3. Conversation task: select conversation scenario
  await materialsBtn.click();
  await expect(page.locator('#materialsDrawer')).toHaveClass(/is-open/);

  const convCard = page.locator('.scenario-item', {
    hasText: 'Samtale: Åpen planløsning eller eget kontor'
  });
  await expect(convCard).toBeVisible();
  await convCard.click();

  // Close materials drawer to view the conversation
  await materialsBtn.click();
  await expect(page.locator('#materialsDrawer')).toHaveClass(/is-closed/);

  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
  await expect(page.locator('[data-testid="scenarioImageWrapper"]')).toHaveCount(0);

  if (testInfo.project.name === 'phone') {
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/scenario-390x844-conversation.png' });
  }
});

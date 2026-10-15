import { expect, test, type Page } from 'playwright/test';

async function openJobbintervju(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await page.getByRole('link', { name: 'Начать практику' }).click();
  await expect(page).toHaveURL(/\/(studio|practice)$/);
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
  const jobbBtn = page.locator('button[data-module="jobbintervju"]');
  const toggleBtn = page.locator('.materials-toggle-btn');
  await expect(async () => {
    if (!(await jobbBtn.isVisible())) {
      await toggleBtn.click();
    }
    await expect(jobbBtn).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  await jobbBtn.click();
  await page.locator('.materials-toggle-btn').click();
  await expect(page.locator('#chatStream .msg-ai').first()).toContainText(
    'Kan du fortelle litt om deg selv og hva slags jobb du søker?'
  );
}

test('the interview opens neutrally, without claims about a CV', async ({ page }, testInfo) => {
  await openJobbintervju(page);
  const body = page.locator('body');
  await expect(body).not.toContainText(/finn\.no|din CV|резюме|logistikk/i);

  if (testInfo.project.name === 'phone') {
    // Let the module switch animation finish before the screenshot.
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/screenshots/jobbintervju-390x844-opening.png' });
  }
});

test('a pasted vacancy starts an interview for that job', async ({ page }, testInfo) => {
  await openJobbintervju(page);
  await page.locator('.materials-toggle-btn').click();

  const field = page.getByLabel('Вставьте текст вакансии (по желанию)');
  await field.scrollIntoViewIfNeeded();
  await field.fill(
    'Vi søker en blid og pålitelig medarbeider til bakeriet vårt. Du må kunne jobbe tidlig om morgenen og like å snakke med kunder.'
  );
  await expect(page.getByText(/Текст не сохраняется/)).toBeVisible();

  if (testInfo.project.name === 'phone') {
    await page.locator('#vacancyBox').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'docs/screenshots/jobbintervju-390x844-with-vacancy.png' });
  }

  const coachRequest = page.waitForRequest('**/api/coach');
  await page.getByRole('button', { name: 'Начать интервью по этой вакансии' }).click();
  await expect(page.locator('#chatStream .msg-ai').first()).toContainText(
    'Takk for at du søkte på denne stillingen.'
  );

  if (!(await page.locator('#userSpeechInput').isVisible())) {
    await page.getByRole('button', { name: 'Написать ответ' }).click();
  }
  await page.locator('#userSpeechInput').fill('Jeg heter Anna og jeg liker å jobbe med mennesker.');
  await page.locator('#sendSpeechBtn').click();
  const request = await coachRequest;
  const payload = request.postDataJSON();
  expect(payload.customScenario.sourceText).toContain('bakeriet vårt');
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
});

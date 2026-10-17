import { expect, test, type Page } from 'playwright/test';

async function openJobbintervju(page: Page) {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/practice?scenario=jobb-intervju-start');
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();
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
  await page.locator('.practice-header-title-btn').click();

  const customToggle = page.locator('.topic-custom-toggle-btn');
  if ((await customToggle.getAttribute('aria-expanded')) !== 'true') {
    await customToggle.click();
  }

  const field = page.locator('#topicCustomText');
  await field.fill(
    'Vi søker en blid og pålitelig medarbeider til bakeriet vårt. Du må kunne jobbe tidlig om morgenen og like å snakke med kunder.'
  );
  await expect(page.getByText(/Текст останется в браузере/)).toBeVisible();

  if (testInfo.project.name === 'phone') {
    await page.screenshot({ path: 'docs/screenshots/jobbintervju-390x844-with-vacancy.png' });
  }

  const coachRequest = page.waitForRequest('**/api/coach');
  await page.locator('.topic-custom-apply-btn').click();
  await expect(page.locator('#chatStream .msg-ai').first()).toBeVisible();

  const writeBtn = page.getByRole('button', { name: 'Написать ответ' });
  if (await writeBtn.isVisible()) {
    await writeBtn.click();
  }
  await page.locator('#userSpeechInput').fill('Jeg heter Anna og jeg liker å jobbe med mennesker.');
  await page.locator('#sendSpeechBtn').click();
  const request = await coachRequest;
  const payload = request.postDataJSON();
  expect(payload.customScenario.sourceText).toContain('bakeriet vårt');
  await expect(page.locator('#chatStream .msg-ai')).toHaveCount(2, { timeout: 15000 });
});

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { chromium } from 'playwright';

const DEFAULT_PORT = 3125;
const OUT_DIR = path.resolve(process.env.SCREENSHOT_DIR || 'docs/screenshots');

const MOCK_COACH_RESPONSE = {
  reply_norsk: 'Det er et godt poeng! Hvilke ulemper ser du ved hjemmekontor i lengden?',
  reply_l1: 'Хороший аргумент! Какие минусы удалённой работы ты видишь в долгосрочной перспективе?',
  correction: {
    original: 'Jeg tror hjemmekontor er bra fordi jeg sparer tid.',
    natural_bokmal: 'Jeg mener hjemmekontor er gunstig fordi jeg sparer reisetid.',
    b2_upgrade: 'Etter min mening bidrar hjemmekontor til bedre tidsbruk i hverdagen.',
    grammar_rule_l1: 'Глагол «mene» звучит убедительнее «tro» при аргументации на экзамене B1/B2.',
    cefr_estimate: 'B1+',
    v2_status: '✓ Korrekt V2',
    samhandling_status: 'Хороший аргумент'
  },
  next_hints: [
    {
      label: 'Развить мысль (B1+)',
      norsk: 'En ulempe kan være mindre sosial kontakt med kolleger.',
      ru: 'Минусом может быть меньше социального контакта с коллегами.',
      ua: 'Мінусом може бути менше соціального контакту з колегами.',
      en: 'A disadvantage can be less social contact with colleagues.'
    }
  ]
};

const TARGETS = [
  { name: 'home-390x844-light.png', width: 390, height: 844, colorScheme: 'light' },
  { name: 'home-390x844-dark.png', width: 390, height: 844, colorScheme: 'dark' },
  {
    name: 'home-390x844-materials.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    openMaterials: true
  },
  { name: 'home-1440x900-light.png', width: 1440, height: 900, colorScheme: 'light' },
  { name: 'home-1440x900-dark.png', width: 1440, height: 900, colorScheme: 'dark' },
  {
    name: 'home-390x844-correction.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    submitTurn: true
  },
  {
    name: 'home-390x844-comfort.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    openComfort: true
  },
  {
    name: 'home-390x844-dark-correction.png',
    width: 390,
    height: 844,
    colorScheme: 'dark',
    submitTurn: true
  },
  {
    name: 'home-1440x900-correction.png',
    width: 1440,
    height: 900,
    colorScheme: 'light',
    submitTurn: true
  },
  {
    name: 'nora-lab-1440x900-light.png',
    width: 1440,
    height: 900,
    colorScheme: 'light',
    routePath: '/lab/nora'
  },
  {
    name: 'nora-lab-1440x900-dark.png',
    width: 1440,
    height: 900,
    colorScheme: 'dark',
    routePath: '/lab/nora'
  }
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  if (process.env.BASE_URL) {
    return { url: process.env.BASE_URL, close: async () => {} };
  }
  const existingUrl = 'http://127.0.0.1:3000/';
  if (await checkUrl(existingUrl)) {
    return { url: existingUrl, close: async () => {} };
  }

  const nextBin = path.resolve('node_modules/next/dist/bin/next');
  const hasBuild = fs.existsSync(path.resolve('.next/BUILD_ID'));
  const args = [nextBin, hasBuild ? 'start' : 'dev', '--port', String(DEFAULT_PORT)];
  const child = spawn(process.execPath, args, {
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: hasBuild ? 'production' : 'development',
      NORA_LAB_ENABLED: 'true'
    }
  });

  const url = `http://127.0.0.1:${DEFAULT_PORT}/`;
  for (let i = 0; i < 60; i += 1) {
    if (await checkUrl(url)) {
      return {
        url,
        close: async () => {
          child.kill();
        }
      };
    }
    await new Promise((r) => globalThis.setTimeout(r, 500));
  }

  child.kill();
  throw new Error(`Timed out waiting for Next.js server on ${url}`);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    try {
      return await chromium.launch({ headless: true, channel: 'msedge' });
    } catch {
      return await chromium.launch({ headless: true, channel: 'chrome' });
    }
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await ensureServer();
  const browser = await launchBrowser();

  const activeTargets =
    process.env.ONLY_NORA === 'true'
      ? TARGETS.filter((t) => t.name.startsWith('nora-lab-'))
      : TARGETS;

  try {
    for (const target of activeTargets) {
      const context = await browser.newContext({
        viewport: { width: target.width, height: target.height },
        colorScheme: target.colorScheme
      });
      const page = await context.newPage();

      await page.route('**/api/coach', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_COACH_RESPONSE)
        });
      });

      const targetUrl = target.routePath
        ? new URL(target.routePath, server.url).toString()
        : server.url;
      await page.goto(targetUrl, { waitUntil: 'networkidle' });

      if (target.submitTurn) {
        await page.fill(
          '#userSpeechInput',
          'Jeg tror hjemmekontor er bra fordi jeg sparer tid.'
        );
        await page.click('#sendSpeechBtn');
        await page.locator('#latestCorrectionCard').waitFor({ state: 'visible' });
        await page
          .locator('#latestCorrectionCard')
          .evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(350);
      }

      if (target.openMaterials) {
        await page.click('#materialsToggleBtn');
        await page.locator('#materialsDrawer.is-open').waitFor({ state: 'visible' });
      }

      if (target.openComfort) {
        await page.click('#materialsToggleBtn');
        await page.locator('#comfortSettingsBtn').waitFor({ state: 'visible' });
        await page.click('#comfortSettingsBtn');
        await page.locator('[role="dialog"][aria-label="Удобство"]').waitFor({
          state: 'visible'
        });
      }

      const filePath = path.join(OUT_DIR, target.name);
      await page.screenshot({ path: filePath, fullPage: false });
      process.stdout.write(`Saved screenshot: ${filePath}\n`);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  process.stderr.write(`Screenshot capture failed: ${String(err)}\n`);
  process.exit(1);
});

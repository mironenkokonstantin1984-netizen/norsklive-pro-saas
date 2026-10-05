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
  },
  {
    name: 'correction-390x844-ok.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    submitTurn: true,
    inputText: 'Jeg tenker at miljø er viktig fordi jeg bor i Oslo.',
    customCoachResponse: {
      reply_norsk: 'Det er et godt poeng! Miljø og bærekraft er viktige temaer i dag.',
      reply_l1: 'Хороший аргумент! Экология и устойчивое развитие — важные темы сегодня.',
      feedback: {
        status: 'ok',
        errors: [],
        praise_l1: 'Kjempebra! Setningen er helt korrekt, både grammatikk og ordstilling sitter.',
        level_estimate: 'B1'
      },
      next_hints: [
        {
          label: 'Utvikle tanken (B1)',
          norsk: 'I tillegg prøver jeg å reise mer kollektivt i hverdagen.',
          ru: 'Кроме того, я стараюсь чаще пользоваться общественным транспортом.'
        }
      ]
    }
  },
  {
    name: 'correction-390x844-one-error.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    submitTurn: true,
    inputText: 'I dag jeg liker kaffe.',
    customCoachResponse: {
      reply_norsk: 'Det forstår jeg godt! Hva slags kaffe liker du best?',
      reply_l1: 'Прекрасно понимаю! Какой кофе ты любишь больше всего?',
      feedback: {
        status: 'has_errors',
        errors: [
          {
            quote: 'I dag jeg liker',
            fix: 'I dag liker jeg',
            type: 'word_order',
            rule_name_l1: 'Правило V2',
            explanation_l1: 'Когда предложение начинается с обстоятельства времени (I dag), глагол должен стоять на втором месте (инверсия).'
          }
        ],
        praise_l1: 'Godt forsøk! Meningen er helt klar.',
        level_estimate: 'A2'
      },
      next_hints: [
        {
          label: 'Fortelle mer (A2)',
          norsk: 'Jeg drikker vanligvis to kopper kaffe hver morgen.',
          ru: 'Обычно я пью две чашки кофе каждое утро.'
        }
      ]
    }
  },
  {
    name: 'correction-390x844-several-errors.png',
    width: 390,
    height: 844,
    colorScheme: 'light',
    submitTurn: true,
    openBetter: true,
    inputText: 'I fjor jeg har kjøpt en hus.',
    customCoachResponse: {
      reply_norsk: 'Gratulerer! Hvor i Norge ligger huset ditt?',
      reply_l1: 'Поздравляю! В какой части Норвегии находится твой дом?',
      feedback: {
        status: 'has_errors',
        errors: [
          {
            quote: 'I fjor jeg har kjøpt',
            fix: 'I fjor kjøpte jeg',
            type: 'word_order',
            rule_name_l1: 'V2 и прошедшее время',
            explanation_l1: 'С точным указанием времени в прошлом (i fjor) используется претеритум (kjøpte), а глагол стоит на втором месте.'
          },
          {
            quote: 'en hus',
            fix: 'et hus',
            type: 'article',
            rule_name_l1: 'Род существительного',
            explanation_l1: 'Слово hus среднего рода (intetkjønn), поэтому неопределённый артикль — et.'
          }
        ],
        praise_l1: 'Flott framgang! Du uttrykker deg forståelig.',
        level_estimate: 'A2',
        better_version: 'I fjor kjøpte jeg et koselig hus litt utenfor byen.'
      },
      next_hints: [
        {
          label: 'Beskrive huset (A2)',
          norsk: 'Det er et lite hus med en koselig hage.',
          ru: 'Это маленький дом с уютным садом.'
        }
      ]
    }
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
      : process.env.ONLY_CORRECTION === 'true'
        ? TARGETS.filter((t) => t.name.startsWith('correction-390x844-'))
        : TARGETS;

  try {
    for (const target of activeTargets) {
      const context = await browser.newContext({
        viewport: { width: target.width, height: target.height },
        colorScheme: target.colorScheme
      });
      const page = await context.newPage();

      await page.route(/\/api\/coach/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(target.customCoachResponse || MOCK_COACH_RESPONSE)
        });
      });

      const targetPath = target.routePath || (target.submitTurn ? '/studio' : '/');
      const targetUrl = new URL(targetPath, server.url).toString();
      await page.goto(targetUrl, { waitUntil: 'networkidle' });

      if (target.submitTurn) {
        await page.fill(
          '#userSpeechInput',
          target.inputText || 'Jeg tror hjemmekontor er bra fordi jeg sparer tid.'
        );
        await page.click('#sendSpeechBtn');
        await page.locator('#latestCorrectionCard').waitFor({ state: 'visible' });

        if (target.openBetter) {
          const betterBtn = page.locator('.correction-better-btn');
          if (await betterBtn.isVisible()) {
            await betterBtn.click();
            await page.waitForTimeout(200);
          }
        }

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

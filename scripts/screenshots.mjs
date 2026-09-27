import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_PORT = 3125;
const OUT_DIR = path.resolve(process.env.SCREENSHOT_DIR || 'docs/screenshots');

const TARGETS = [
  { name: 'home-390x844-light.png', width: 390, height: 844, colorScheme: 'light' },
  { name: 'home-390x844-dark.png', width: 390, height: 844, colorScheme: 'dark' },
  { name: 'home-1440x900-light.png', width: 1440, height: 900, colorScheme: 'light' },
  { name: 'home-1440x900-dark.png', width: 1440, height: 900, colorScheme: 'dark' }
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
    env: { ...process.env, NODE_ENV: hasBuild ? 'production' : 'development' }
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

  try {
    for (const target of TARGETS) {
      const context = await browser.newContext({
        viewport: { width: target.width, height: target.height },
        colorScheme: target.colorScheme
      });
      const page = await context.newPage();
      await page.goto(server.url, { waitUntil: 'networkidle' });
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

import fs from 'node:fs';
import process from 'node:process';
import { chromium, defineConfig } from 'playwright/test';

const hasBundledChromium = (() => {
  try {
    return fs.existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

const chromiumUse = {
  browserName: 'chromium',
  ...(hasBundledChromium ? {} : { channel: 'msedge' })
};

export default defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3100',
    ...chromiumUse
  },
  webServer: {
    command: 'npm run build && npm start',
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      PORT: '3100',
      AUTH_ENABLED: 'false',
      GEMINI_API_KEY: '',
      WORDS_SHOW_DRAFTS: 'true',
      SCENARIOS_SHOW_DRAFTS: 'true',
      NEXT_PUBLIC_SCENARIOS_SHOW_DRAFTS: 'true',
      // No real AI in e2e: canned example answers, labelled «Пример ответа, ИИ не подключён».
      COACH_ALLOW_FALLBACK: 'true'
    }
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...chromiumUse,
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'phone',
      use: {
        ...chromiumUse,
        viewport: { width: 390, height: 844 }
      }
    }
  ]
});

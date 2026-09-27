const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { CoachRequestSchema, CoachResponseSchema } = require('./schemas');
const { buildGeminiCoachPayload } = require('./prompts/coach');
const { generateStrategicRAndDFallback, findScenario } = require('./fallback');

function createApp(options = {}) {
  const app = express();

  // Security headers & 16kb body limit
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '16kb' }));

  // 301 permanent redirect from legacy /norsk to /
  app.get(['/norsk', '/norsk/*'], (req, res) => {
    return res.redirect(301, '/');
  });

  // Rate limiter: 30 requests per 10 minutes per IP
  const coachRateLimiter = rateLimit({
    windowMs: options.rateLimitWindowMs || 10 * 60 * 1000,
    limit: options.rateLimitMax || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  app.post('/api/coach', coachRateLimiter, async (req, res) => {
    const parsed = CoachRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        issues: parsed.error.issues
      });
    }

    const { module, scenarioId, level, l1, persona, userText, history, usedWords, customScenario } =
      parsed.data;

    const scenario = findScenario(module, scenarioId, customScenario);
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const payload = buildGeminiCoachPayload({
          scenario,
          level,
          l1,
          persona,
          userText,
          history,
          usedWords
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelName
        )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

        const fetchFn = options.fetchImpl || globalThis.fetch;
        const response = await fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
          throw new Error(`Gemini HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) {
          throw new Error('Empty Gemini response');
        }

        const parsedOutput = JSON.parse(rawJson);
        const validated = CoachResponseSchema.parse(parsedOutput);
        return res.status(200).json(validated);
      } catch (_err) {
        // Fall through to deterministic rule-based fallback on any Gemini error/timeout
      }
    }

    const fallbackResult = generateStrategicRAndDFallback({
      userText,
      module,
      scenarioId,
      l1,
      persona,
      usedWords,
      customScenario
    });
    const validatedFallback = CoachResponseSchema.parse(fallbackResult);
    return res.status(200).json(validatedFallback);
  });

  // Explicit 404 for any other /api/* route (including removed /api/scrape-finn)
  app.all('/api/*', (req, res) => {
    return res.status(404).json({ error: 'API route not found' });
  });

  // Serve static trainer UI at /
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

const app = createApp();

module.exports = {
  app,
  createApp
};

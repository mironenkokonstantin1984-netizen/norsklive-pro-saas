/* global console, fetch, AbortSignal, setTimeout */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CSV_PATH = path.resolve('docs/golden-set/coach-golden.csv');
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\r') {
      // ignore CR
    } else if (char === '\n') {
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function getLanguageName(l1) {
  if (l1 === 'ua') return 'Ukrainian (Українська)';
  if (l1 === 'en') return 'English';
  return 'Russian (Русский)';
}

function buildPayload({ level, l1, userText }) {
  const langName = getLanguageName(l1);
  const instructionPart = `Du spiller Sensor Kari (Eksaminator ved HK-dir).
Brukerens mål-nivå: ${level}.
Brukerens morsmål (L1) for grammatiske forklaringer og ros: ${langName}.
OPPGAVE:
Analyser brukerens neste ytring (sendt som en separat meldingsdel nedenfor).
Viktige instruksjoner for feilretting og vurdering:
1. RAPPORTER KUN REELLE FEIL: Rapporter kun faktiske feil i grammatikk, ordstilling (f.eks. V2-inversjon), artikler (en/ei/et, bestemt/ubestemt form), verbbøyning, preposisjoner eller ordforråd som er relevante for mål-nivået (${level}).
2. IKKE SKRIV OM KORREKTE SETNINGER: Hvis setningen er grammatisk riktig og naturlig for nivået, må du ALDRI omskrive eller finne på feil. Returner da "status": "ok", "errors": [] og en konkret oppmuntrende ros på ${langName} i "praise_l1".
3. MINIMAL RETTELSE: Hvis det finnes en feil, skal "fix" være minimal (endre KUN de ordene som faktisk er feil, uten å omskrive hele setningen). "quote" MÅ være et nøyaktig sitat/tekstfragment fra brukerens tekst.
4. INGEN B2-OPPGRADERING med mindre mål-nivået er B2: "better_version" er valgfritt (maks én setning) og skal KUN inkluderes dersom det lærer bort noe nyttig på mål-nivået.
5. FORKLARINGER: Korte forklaringer (høyst 2 setninger) på ${langName}. Oppgi kort regelnavn i "rule_name_l1".
6. EKSAMINATORSVAR (reply_norsk): 2–3 korte setninger på mål-nivået (${level}) som reagerer på innholdet og avslutter med et åpent oppfølgingsspørsmål. "reply_l1" er oversettelse til ${langName}.
7. SAMHANDLING: Valgfritt kort tips på ${langName} i "samhandling_l1".
8. HINTS: 2 korte svarforslag på mål-nivået i "next_hints".`;

  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: instructionPart }, { text: userText }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply_norsk: { type: 'STRING' },
          reply_l1: { type: 'STRING' },
          feedback: {
            type: 'OBJECT',
            properties: {
              status: { type: 'STRING', enum: ['ok', 'has_errors'] },
              errors: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    quote: { type: 'STRING' },
                    fix: { type: 'STRING' },
                    type: {
                      type: 'STRING',
                      enum: [
                        'word_order',
                        'article',
                        'verb_form',
                        'preposition',
                        'vocabulary',
                        'spelling',
                        'other'
                      ]
                    },
                    rule_name_l1: { type: 'STRING' },
                    explanation_l1: { type: 'STRING' }
                  },
                  required: ['quote', 'fix', 'type', 'rule_name_l1', 'explanation_l1']
                }
              },
              praise_l1: { type: 'STRING' },
              level_estimate: { type: 'STRING', enum: ['A2', 'B1', 'B2'] },
              better_version: { type: 'STRING' },
              samhandling_l1: { type: 'STRING' }
            },
            required: ['status', 'errors', 'praise_l1', 'level_estimate']
          },
          next_hints: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label: { type: 'STRING' },
                norsk: { type: 'STRING' },
                ru: { type: 'STRING' },
                ua: { type: 'STRING' },
                en: { type: 'STRING' }
              },
              required: ['label', 'norsk']
            }
          }
        },
        required: ['reply_norsk', 'reply_l1', 'feedback', 'next_hints']
      },
      temperature: 0.2
    }
  };
}

async function callGemini(apiKey, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    MODEL_NAME
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini');
  return JSON.parse(rawText);
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.log('skipped: no GEMINI_API_KEY');
    process.exit(0);
  }

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const rawCsv = fs.readFileSync(CSV_PATH, 'utf-8');
  const allRows = parseCsv(rawCsv);
  if (allRows.length < 2) {
    console.error('Error: CSV file has no data rows');
    process.exit(1);
  }

  const [header, ...rows] = allRows;
  const colIndex = (name) => header.indexOf(name);

  const idxId = colIndex('id');
  const idxLevel = colIndex('level');
  const idxL1 = colIndex('l1');
  const idxText = colIndex('learner_text');
  const idxHasError = colIndex('has_error');
  const idxExpectedQuote = colIndex('expected_error_quote');

  console.log(`\nEvaluating Coach against Golden Set (${rows.length} sentences)...`);
  console.log(`Model: ${MODEL_NAME}, Temperature: 0.2\n`);

  let correctCount = 0;
  let correctOkCount = 0; // True Negatives (TN)
  let falsePositiveCount = 0; // FP

  let errorCount = 0;
  let errorCaughtCount = 0; // True Positives (TP)
  let falseNegativeCount = 0; // FN
  let quoteMatchCount = 0;

  const results = [];

  for (const row of rows) {
    const id = row[idxId];
    const level = row[idxLevel] || 'A2';
    const l1 = row[idxL1] || 'ru';
    const userText = row[idxText];
    const hasError = row[idxHasError]?.toLowerCase() === 'true';
    const expectedQuote = row[idxExpectedQuote] || '';

    const payload = buildPayload({ level, l1, userText });

    try {
      const coachResponse = await callGemini(apiKey, payload);
      const feedback = coachResponse?.feedback;
      const status = feedback?.status;
      const errors = Array.isArray(feedback?.errors) ? feedback.errors : [];

      let itemResult = 'PASS';
      let quoteMatch = false;

      if (!hasError) {
        correctCount += 1;
        if (status === 'ok') {
          correctOkCount += 1;
        } else {
          falsePositiveCount += 1;
          itemResult = 'FAIL (False Positive)';
        }
      } else {
        errorCount += 1;
        if (status === 'has_errors') {
          errorCaughtCount += 1;
          // Check quote overlap
          quoteMatch = errors.some((err) => {
            const q = (err.quote || '').toLowerCase();
            const exp = expectedQuote.toLowerCase();
            return q.includes(exp) || exp.includes(q);
          });
          if (quoteMatch) {
            quoteMatchCount += 1;
          } else {
            itemResult = 'PARTIAL (Quote Mismatch)';
          }
        } else {
          falseNegativeCount += 1;
          itemResult = 'FAIL (False Negative)';
        }
      }

      results.push({
        id,
        level,
        hasError,
        expectedQuote,
        status,
        quoteMatch: hasError ? (quoteMatch ? 'YES' : 'NO') : 'N/A',
        result: itemResult
      });

      console.log(`[${id}] ${itemResult} | Text: "${userText}"`);
    } catch (err) {
      console.error(`[${id}] ERROR: ${err.message}`);
      results.push({
        id,
        level,
        hasError,
        status: 'ERROR',
        result: `ERROR: ${err.message}`
      });
    }

    // Small delay to prevent rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  const total = rows.length;
  const accuracy = (((correctOkCount + errorCaughtCount) / total) * 100).toFixed(1);
  const fpRate = correctCount > 0 ? ((falsePositiveCount / correctCount) * 100).toFixed(1) : '0';
  const fnRate = errorCount > 0 ? ((falseNegativeCount / errorCount) * 100).toFixed(1) : '0';
  const quoteMatchRate = errorCount > 0 ? ((quoteMatchCount / errorCount) * 100).toFixed(1) : '0';

  console.log('\n--- EVALUATION SUMMARY ---');
  console.table({
    'Total Sentences': total,
    'Correct Sentences (Ground Truth)': correctCount,
    'Correct Recognized as OK (Target: 10/10)': `${correctOkCount}/${correctCount}`,
    'Error Sentences (Ground Truth)': errorCount,
    'Errors Caught (Target: >=18/20)': `${errorCaughtCount}/${errorCount}`,
    'False Corrections (Target: 0)': falsePositiveCount,
    'Missed Errors': falseNegativeCount,
    'Quote Matches': `${quoteMatchCount}/${errorCount}`,
    'Overall Accuracy': `${accuracy}%`,
    'False Positive Rate': `${fpRate}%`,
    'False Negative Rate': `${fnRate}%`,
    'Quote Match Rate': `${quoteMatchRate}%`
  });

  if (falsePositiveCount > 0) {
    console.warn(`\nWARNING: Detected ${falsePositiveCount} false positive correction(s) on correct sentences!`);
  }
}

run().catch((err) => {
  console.error('Fatal eval error:', err);
  process.exit(1);
});

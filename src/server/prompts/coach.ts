import type { ScenarioRecord } from '../fallback';
import type { HistoryTurn } from '../schemas';

export function getLanguageName(l1: string): string {
  if (l1 === 'ua') return 'Ukrainian (Українська)';
  if (l1 === 'en') return 'English';
  return 'Russian (Русский)';
}

export function getPersonaInstruction(persona: string, scenario: ScenarioRecord): string {
  if (persona === 'interrupting') {
    return 'Du spiller en uenig og litt avbrytende medkandidat (Jonas) på muntlig Norskprøve Del 2. Utfordre brukerens argument høflig men bestemt.';
  }
  if (persona === 'passive') {
    return 'Du spiller en usikker og passiv medkandidat som svarer kort, slik at brukeren må vise Samhandling ved å stille deg åpne spørsmål.';
  }
  return `Du spiller ${scenario.partnerName || 'Sensor Kari'} (${scenario.partnerRole || 'Eksaminator ved HK-dir'}).`;
}

export interface BuildGeminiCoachPayloadInput {
  scenario: ScenarioRecord;
  level: string;
  l1: string;
  persona: string;
  userText: string;
  history?: HistoryTurn[];
  usedWords?: string[];
}

/**
 * Builds the Gemini generateContent request payload.
 * Security / Prompt-Injection Hardening:
 * `userText` is NEVER interpolated into the system instruction or JSON schema template.
 * Instead, `userText` is passed as a separate content part in `contents`.
 */
export function buildGeminiCoachPayload({
  scenario,
  level,
  l1,
  persona,
  userText,
  history = [],
  usedWords = []
}: BuildGeminiCoachPayloadInput) {
  const langName = getLanguageName(l1);
  const personaInstruction = getPersonaInstruction(persona, scenario);
  const usedSet = new Set((usedWords || []).map((w) => w.toLowerCase()));
  const unusedWords = (scenario.targetWords || [])
    .filter((w) => !usedSet.has(w.word.toLowerCase()))
    .map((w) => w.word);

  const recentTurnsSummary = (history || [])
    .slice(-6)
    .map((turn) => `${turn.sender === 'ai' ? 'Partner' : 'Kandidat'}: ${turn.norsk}`)
    .join('\n');

  const instructionPart = `${personaInstruction}
Brukerens mål-nivå: ${level}.
Brukerens morsmål (L1) for grammatiske forklaringer og ros: ${langName}.
Kontekst / Kilde: ${scenario.sourceText || ''}
Målord som brukeren ennå IKKE har brukt i samtalen: ${unusedWords.join(', ')}.
${recentTurnsSummary ? `Tidligere replikker i samtalen:\n${recentTurnsSummary}\n` : ''}
OPPGAVE:
Analyser brukerens neste ytring (sendt som en separat meldingsdel nedenfor).
Viktige instruksjoner for feilretting og vurdering:
1. RAPPORTER KUN REELLE FEIL: Rapporter kun faktiske feil i grammatikk, ordstilling (f.eks. V2-inversjon), artikler (en/ei/et, bestemt/ubestemt form), verbbøyning, preposisjoner eller ordforråd som er relevante for mål-nivået (${level}).
2. IKKE SKRIV OM KORREKTE SETNINGER: Hvis setningen er grammatisk riktig og naturlig for nivået, må du ALDRI omskrive eller finne på feil. Returner da "status": "ok", "errors": [] og en konkret oppmuntrende ros på ${langName} i "praise_l1".
3. MINIMAL RETTELSE: Hvis det finnes en feil, skal "fix" være minimal (endre KUN de ordene som faktisk er feil, uten å omskrive hele setningen). "quote" MÅ være et nøyaktig sitat/tekstfragment fra brukerens tekst.
4. INGEN B2-OPPGRADERING med mindre mål-nivået er B2: "better_version" er valgfritt (maks én setning) og skal KUN inkluderes dersom det lærer bort noe nyttig på mål-nivået.
5. FORKLARINGER: Korte forklaringer (høyst 2 setninger) på ${langName}. Oppgi kort regelnavn i "rule_name_l1".
6. EKSAMINATORSVAR (reply_norsk): 2–3 korte setninger på mål-nivået (${level}) som reagerer på innholdet og avslutter med et åpent oppfølgingsspørsmål. "reply_l1" er oversettelse til ${langName}.
7. SAMHANDLING: Valgfritt kort tips på ${langName} i "samhandling_l1" (f.eks. om å stille oppfølgingsspørsmål til samtalepartneren).
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

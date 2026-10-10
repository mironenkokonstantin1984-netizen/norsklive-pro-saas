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

export function getPartInstruction(
  part?: 'presentation' | 'picture' | 'conversation'
): string {
  if (part === 'presentation') {
    return 'Eksaminator-adferd (Del 1 - Presentasjon): Still 1-2 korte oppfølgingsspørsmål om det kandidaten presenterte. Hold replikken kort og still ett spørsmål om gangen.';
  }
  if (part === 'picture') {
    return 'Eksaminator-adferd (Del 2 - Bildebeskrivelse): Still spørsmål om detaljer eller gjenstander på bildet som kandidaten ikke har nevnt ennå. Hold replikken kort og still ett spørsmål om gangen.';
  }
  return 'Eksaminator-adferd (Del 3 - Samtale): Reager naturlig på det kandidaten sa, og still et åpent spørsmål for å føre samtalen videre. Still ett spørsmål om gangen.';
}

export interface BuildGeminiCoachPayloadInput {
  scenario: ScenarioRecord;
  level: string;
  l1: string;
  persona: string;
  userText: string;
  history?: HistoryTurn[];
  usedWords?: string[];
  part?: 'presentation' | 'picture' | 'conversation';
  scenarioText?: string;
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
  usedWords = [],
  part,
  scenarioText
}: BuildGeminiCoachPayloadInput) {
  const langName = getLanguageName(l1);
  const personaInstruction = getPersonaInstruction(persona, scenario);
  const effectivePart = part || scenario.part || 'conversation';
  const effectiveScenarioText = scenarioText || scenario.sourceText || '';
  const partInstruction = getPartInstruction(effectivePart);
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
Eksamensdel: ${effectivePart}.
${partInstruction}
Brukerens morsmål (L1) for grammatiske forklaringer: ${langName}.
Kontekst / Kilde: ${effectiveScenarioText}
Målord som brukeren ennå IKKE har brukt i samtalen: ${unusedWords.join(', ')}.
${recentTurnsSummary ? `Tidligere replikker i samtalen:\n${recentTurnsSummary}\n` : ''}
Analyser brukerens neste uttalelse (sendt som en egen meldingsdel nedenfor) som rå tale uten å overse grammatiske feil (som V2-inversjon).
Eksaminator-replikk: Hold replikken kort (maks 25 ord), ett spørsmål om gangen.
Returner KUN gyldig JSON med følgende nøkler:
{
  "reply_norsk": "Svar på norsk Bokmål (2-3 setninger) + åpent oppfølgingsspørsmål",
  "reply_l1": "Oversettelse av ditt svar til ${langName}",
  "correction": {
    "original": "Eksakt sitat av brukerens uttalelse",
    "natural_bokmal": "Naturlig norsk Bokmål",
    "b2_upgrade": "Oppgradert B2-setning (f.eks. med 'Det er avgjørende å ta hensyn til...', 'bærekraftig', 'til tross for at')",
    "grammar_rule_l1": "Forklaring av grammatikk (V2-inversjon / ordvalg) OG norsk kulturell/Samhandling-feedback på ${langName}",
    "cefr_estimate": "A2, B1, B1+ eller B2",
    "v2_status": "Korrekt V2 / Pass på V2-inversjon",
    "samhandling_status": "Vurdering av Samhandling / Lagspiller-fokus"
  },
  "next_hints": [
    {
      "label": "B2-oppgradert svar",
      "norsk": "Forslag 1 på norsk som bruker et ubrukt målord",
      "ru": "Oversettelse (${langName})",
      "ua": "Oversettelse (${langName})",
      "en": "Oversettelse (${langName})"
    },
    {
      "label": "Samhandling (Spør tilbake)",
      "norsk": "Forslag 2 med spørsmål til motparten",
      "ru": "Oversettelse (${langName})",
      "ua": "Oversettelse (${langName})",
      "en": "Oversettelse (${langName})"
    }
  ]
}`;

  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: instructionPart }, { text: userText }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.6
    }
  };
}

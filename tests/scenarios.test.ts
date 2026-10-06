import { describe, it, expect } from 'vitest';
import {
  ExamScenarioSchema,
  type ExamScenario
} from '../src/content/scenarios/types';

describe('ExamScenarioSchema zod validation (Issue #50)', () => {
  const sampleValidPresentation: ExamScenario = {
    id: 'np-a2-presentation-arbeid',
    title: 'Presentasjon: Arbeid og erfaring',
    level: 'A2',
    part: 'presentation',
    topic: 'arbeid',
    badge: 'Norskprøve A2 · Del 1',
    avatar: '👩‍🏫',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell kort om deg selv og arbeidet ditt.',
    sourceText: 'Fortell om jobben din eller en jobb du ønsker.',
    targetWords: [
      { word: 'kollega', translation: 'коллега', ua: 'колега', en: 'colleague' },
      { word: 'avdeling', translation: 'отдел', ua: 'відділ', en: 'department' },
      { word: 'pause', translation: 'перерыв', ua: 'перерва', en: 'break' },
      { word: 'sjef', translation: 'начальник', ua: 'керівник', en: 'boss' },
      { word: 'kontor', translation: 'офис', ua: 'офіс', en: 'office' },
      { word: 'lønn', translation: 'зарплата', ua: 'зарплата', en: 'salary' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Kan du fortelle litt om hva du jobber med?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Расскажите немного о том, кем вы работаете?',
    openingUa: 'Ласкаво просимо на усний іспит. Розкажіть трохи про те, ким ви працюєте?',
    openingEn: 'Welcome to the oral exam. Can you tell a little about what you work with?',
    hints: [
      {
        label: 'Start (A2)',
        norsk: 'Jeg jobber som...',
        ru: 'Я работаю...',
        ua: 'Я працюю...',
        en: 'I work as...'
      }
    ],
    status: 'draft'
  };

  it('validates a valid presentation task', () => {
    const parsed = ExamScenarioSchema.safeParse(sampleValidPresentation);
    expect(parsed.success).toBe(true);
  });

  it('validates a valid picture task with image and alts', () => {
    const validPicture: ExamScenario = {
      ...sampleValidPresentation,
      id: 'np-a2-picture-arbeid',
      part: 'picture',
      image: {
        src: '/scenarios/images/workplace.svg',
        alt_nb: 'Et kontorlandskap der tre kolleger samarbeider ved et skrivebord.',
        alt_l1: {
          ru: 'Офис, где три коллеги работают вместе за столом.',
          uk: 'Офіс, де троє колег працюють разом за столом.',
          en: 'An open-plan office where three colleagues collaborate at a desk.'
        }
      }
    };
    const parsed = ExamScenarioSchema.safeParse(validPicture);
    expect(parsed.success).toBe(true);
  });

  it('rejects a picture task when image is missing', () => {
    const missingImage = {
      ...sampleValidPresentation,
      part: 'picture',
      image: undefined
    };
    const parsed = ExamScenarioSchema.safeParse(missingImage);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/Image is required for picture tasks/i);
    }
  });

  it('rejects a scenario with fewer or more than 6 target words', () => {
    const fiveWords = {
      ...sampleValidPresentation,
      targetWords: sampleValidPresentation.targetWords.slice(0, 5)
    };
    const parsed = ExamScenarioSchema.safeParse(fiveWords);
    expect(parsed.success).toBe(false);
  });

  it('rejects target words missing L1 translations (ua or en)', () => {
    const missingUa = {
      ...sampleValidPresentation,
      targetWords: sampleValidPresentation.targetWords.map((w, idx) =>
        idx === 0 ? { ...w, ua: '' } : w
      )
    };
    const parsed = ExamScenarioSchema.safeParse(missingUa);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid level or topic', () => {
    const badLevel = {
      ...sampleValidPresentation,
      level: 'C1'
    };
    expect(ExamScenarioSchema.safeParse(badLevel).success).toBe(false);

    const badTopic = {
      ...sampleValidPresentation,
      topic: 'astronomy'
    };
    expect(ExamScenarioSchema.safeParse(badTopic).success).toBe(false);
  });

  it('validates all 21 A2 scenarios from a2.ts', async () => {
    const { a2Scenarios } = await import('../src/content/scenarios/a2');
    expect(a2Scenarios).toHaveLength(21);

    const ids = new Set<string>();
    for (const sc of a2Scenarios) {
      expect(ids.has(sc.id)).toBe(false);
      ids.add(sc.id);

      const parsed = ExamScenarioSchema.safeParse(sc);
      expect(parsed.success, `Scenario ${sc.id} should match ExamScenarioSchema: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);

      // Check opening line for conversation part <= 25 words
      if (sc.part === 'conversation') {
        const wordCount = sc.openingLine.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(25);
      }
    }
  });

  it('validates all 21 B1 scenarios from b1.ts', async () => {
    const { b1Scenarios } = await import('../src/content/scenarios/b1');
    expect(b1Scenarios).toHaveLength(21);

    const ids = new Set<string>();
    for (const sc of b1Scenarios) {
      expect(ids.has(sc.id)).toBe(false);
      ids.add(sc.id);

      const parsed = ExamScenarioSchema.safeParse(sc);
      expect(parsed.success, `Scenario ${sc.id} should match ExamScenarioSchema: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);

      // Check opening line for conversation part <= 25 words
      if (sc.part === 'conversation') {
        const wordCount = sc.openingLine.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(25);
      }
    }
  });

  it('verifies 42 scenarios total, unique IDs, all 7 topics, and no forbidden B2 words in A2', async () => {
    const { a2Scenarios } = await import('../src/content/scenarios/a2');
    const { b1Scenarios } = await import('../src/content/scenarios/b1');
    const all = [...a2Scenarios, ...b1Scenarios];

    expect(all).toHaveLength(42);

    const allIds = new Set(all.map((s) => s.id));
    expect(allIds.size).toBe(42);

    const topics = ['arbeid', 'bolig', 'helse', 'familie', 'handel', 'transport', 'fritid'] as const;
    const parts = ['presentation', 'picture', 'conversation'] as const;

    for (const lvl of ['A2', 'B1'] as const) {
      const byLvl = all.filter((s) => s.level === lvl);
      expect(byLvl).toHaveLength(21);
      for (const t of topics) {
        for (const p of parts) {
          const match = byLvl.find((s) => s.topic === t && s.part === p);
          expect(match, `Missing scenario for ${lvl} ${t} ${p}`).toBeDefined();
        }
      }
    }

    // Check no forbidden B2 words in A2 target words or text
    const forbiddenB2Words = ['velferdsstat', 'digitalisering', 'bærekraftig', 'sysselsetting', 'følgelig'];
    for (const a2 of a2Scenarios) {
      for (const forbidden of forbiddenB2Words) {
        const inWords = a2.targetWords.some((tw) => tw.word.toLowerCase().includes(forbidden));
        expect(inWords, `A2 scenario ${a2.id} must not contain B2 word "${forbidden}"`).toBe(false);
        expect(a2.openingLine.toLowerCase()).not.toContain(forbidden);
      }
    }
  });
});



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
});

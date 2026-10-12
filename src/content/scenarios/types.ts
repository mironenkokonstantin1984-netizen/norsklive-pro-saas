import { z } from 'zod';

export type ScenarioLevel = 'A2' | 'B1' | 'B2';
export type ScenarioPart = 'presentation' | 'picture' | 'conversation';
export type ScenarioTopic =
  | 'arbeid'
  | 'bolig'
  | 'helse'
  | 'familie'
  | 'handel'
  | 'transport'
  | 'fritid';
export type ScenarioStatus = 'draft' | 'reviewed';

export interface TargetWord {
  word: string;
  translation: string;
  ua?: string;
  en?: string;
  example?: string;
}

export interface ExamStructure {
  part1Prompt: string;
  part2Prompt: string;
  part3Prompt: string;
}

export interface ScenarioHint {
  label: string;
  norsk: string;
  ru: string;
  ua: string;
  en: string;
}

export interface ScenarioImage {
  src: string;
  alt_nb: string;
  alt_l1: {
    ru: string;
    uk: string;
    en: string;
  };
}

export interface Scenario {
  id: string;
  title: string;
  level: string;
  part?: ScenarioPart;
  topic?: ScenarioTopic;
  badge: string;
  avatar: string;
  partnerName: string;
  partnerRole: string;
  description: string;
  examStructure?: ExamStructure;
  sourceText: string;
  targetWords: TargetWord[];
  openingLine: string;
  openingTranslation: string;
  openingUa: string;
  openingEn: string;
  hints: ScenarioHint[];
  image?: ScenarioImage;
  status?: ScenarioStatus;
}

export type ModuleKey = 'norskprove' | 'jobbintervju' | 'pensum';

export type ScenariosByModule = Record<ModuleKey, Scenario[]>;

export const ScenarioImageSchema = z.object({
  src: z.string().min(1),
  alt_nb: z.string().min(1),
  alt_l1: z.object({
    ru: z.string().min(1),
    uk: z.string().min(1),
    en: z.string().min(1)
  })
});

export const ScenarioTargetWordSchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  ua: z.string().min(1),
  en: z.string().min(1),
  example: z.string().optional()
});

export const ExamScenarioSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    level: z.enum(['A2', 'B1']),
    part: z.enum(['presentation', 'picture', 'conversation']),
    topic: z.enum([
      'arbeid',
      'bolig',
      'helse',
      'familie',
      'handel',
      'transport',
      'fritid'
    ]),
    badge: z.string().min(1),
    avatar: z.string().min(1),
    partnerName: z.string().min(1),
    partnerRole: z.string().min(1),
    description: z.string().min(1),
    sourceText: z.string(),
    targetWords: z.array(ScenarioTargetWordSchema).length(6),
    openingLine: z.string().min(1),
    openingTranslation: z.string().min(1),
    openingUa: z.string().min(1),
    openingEn: z.string().min(1),
    hints: z.array(
      z.object({
        label: z.string().min(1),
        norsk: z.string().min(1),
        ru: z.string().min(1),
        ua: z.string().min(1),
        en: z.string().min(1)
      })
    ),
    image: ScenarioImageSchema.optional(),
    status: z.enum(['draft', 'reviewed'])
  })
  .superRefine((data, ctx) => {
    if (data.part === 'picture' && !data.image) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image is required for picture tasks',
        path: ['image']
      });
    }
  });

export type ExamScenario = z.infer<typeof ExamScenarioSchema>;

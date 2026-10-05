import { z } from 'zod';

export const HistoryTurnSchema = z.object({
  sender: z.enum(['user', 'ai']),
  norsk: z.string().max(2000),
  l1: z.string().max(2000).optional()
});

export const TargetWordSchema = z.object({
  word: z.string().max(120),
  translation: z.string().max(300).optional(),
  ua: z.string().max(300).optional(),
  en: z.string().max(300).optional(),
  example: z.string().max(400).optional()
});

export const CustomScenarioSchema = z
  .object({
    id: z.string().max(120).optional(),
    title: z.string().max(200).optional(),
    partnerName: z.string().max(120).optional(),
    partnerRole: z.string().max(200).optional(),
    sourceText: z.string().max(4000).optional(),
    targetWords: z.array(TargetWordSchema).max(20).optional()
  })
  .optional();

export const CoachRequestSchema = z.object({
  module: z.enum(['norskprove', 'jobbintervju', 'pensum']),
  scenarioId: z.string().min(1).max(120),
  level: z.enum(['A2', 'B1', 'B2']),
  l1: z.enum(['ru', 'ua', 'en']),
  persona: z.enum(['standard', 'interrupting', 'passive']),
  userText: z.string().trim().min(1).max(1000),
  history: z.array(HistoryTurnSchema).max(20).optional().default([]),
  usedWords: z.array(z.string().max(120)).max(30).optional().default([]),
  customScenario: CustomScenarioSchema
});

export const HintSchema = z.object({
  label: z.string(),
  norsk: z.string(),
  ru: z.string().optional(),
  ua: z.string().optional(),
  en: z.string().optional()
});

export const CoachFeedbackErrorTypeSchema = z.enum([
  'word_order',
  'article',
  'verb_form',
  'preposition',
  'vocabulary',
  'spelling',
  'other'
]);

export const CoachFeedbackErrorSchema = z.object({
  quote: z.string(),
  fix: z.string(),
  type: CoachFeedbackErrorTypeSchema,
  rule_name_l1: z.string(),
  explanation_l1: z.string()
});

export const CoachFeedbackSchema = z
  .object({
    status: z.enum(['ok', 'has_errors']),
    errors: z.array(CoachFeedbackErrorSchema).max(6).default([]),
    praise_l1: z.string(),
    level_estimate: z.enum(['A2', 'B1', 'B2']),
    better_version: z.string().optional(),
    samhandling_l1: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.status === 'ok' && data.errors.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors must be empty when status is ok',
        path: ['errors']
      });
    }
    if (data.status === 'has_errors' && data.errors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors must not be empty when status is has_errors',
        path: ['errors']
      });
    }
  });

/**
 * Drops errors whose quote does not appear in the learner's text (case-insensitive).
 * If all errors are dropped, updates status to 'ok'.
 */
export function filterFeedbackErrorsByLearnerText(
  feedback: CoachFeedback,
  learnerText: string
): CoachFeedback {
  const lowerText = learnerText.toLowerCase();
  const validErrors = (feedback.errors || []).filter(
    (err) => err.quote && lowerText.includes(err.quote.toLowerCase())
  );
  if (validErrors.length === 0) {
    return {
      ...feedback,
      status: 'ok',
      errors: []
    };
  }
  return {
    ...feedback,
    status: 'has_errors',
    errors: validErrors
  };
}

export const CorrectionSchema = z.object({
  original: z.string(),
  natural_bokmal: z.string(),
  b2_upgrade: z.string(),
  grammar_rule_l1: z.string(),
  cefr_estimate: z.string(),
  v2_status: z.string(),
  samhandling_status: z.string().optional()
});

export const CoachResponseSchema = z.object({
  reply_norsk: z.string(),
  reply_l1: z.string(),
  feedback: CoachFeedbackSchema,
  correction: CorrectionSchema.optional(),
  next_hints: z.array(HintSchema),
  /** Present only on canned example answers (COACH_ALLOW_FALLBACK=true). */
  source: z.literal('fallback').optional()
});

export type HistoryTurn = z.infer<typeof HistoryTurnSchema>;
export type TargetWord = z.infer<typeof TargetWordSchema>;
export type CustomScenario = z.infer<typeof CustomScenarioSchema>;
export type CoachRequest = z.infer<typeof CoachRequestSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type CoachFeedbackErrorType = z.infer<typeof CoachFeedbackErrorTypeSchema>;
export type CoachFeedbackError = z.infer<typeof CoachFeedbackErrorSchema>;
export type CoachFeedback = z.infer<typeof CoachFeedbackSchema>;
export type Correction = z.infer<typeof CorrectionSchema>;
export type CoachResponse = z.infer<typeof CoachResponseSchema>;


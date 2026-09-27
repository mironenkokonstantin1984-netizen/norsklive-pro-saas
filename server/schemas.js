const { z } = require('zod');

const HistoryTurnSchema = z.object({
  sender: z.enum(['user', 'ai']),
  norsk: z.string().max(2000),
  l1: z.string().max(2000).optional()
});

const TargetWordSchema = z.object({
  word: z.string().max(120),
  translation: z.string().max(300).optional(),
  ua: z.string().max(300).optional(),
  en: z.string().max(300).optional(),
  example: z.string().max(400).optional()
});

const CustomScenarioSchema = z
  .object({
    id: z.string().max(120).optional(),
    title: z.string().max(200).optional(),
    partnerName: z.string().max(120).optional(),
    partnerRole: z.string().max(200).optional(),
    sourceText: z.string().max(4000).optional(),
    targetWords: z.array(TargetWordSchema).max(20).optional()
  })
  .optional();

const CoachRequestSchema = z.object({
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

const HintSchema = z.object({
  label: z.string(),
  norsk: z.string(),
  ru: z.string().optional(),
  ua: z.string().optional(),
  en: z.string().optional()
});

const CorrectionSchema = z.object({
  original: z.string(),
  natural_bokmal: z.string(),
  b2_upgrade: z.string(),
  grammar_rule_l1: z.string(),
  cefr_estimate: z.string(),
  v2_status: z.string(),
  samhandling_status: z.string().optional()
});

const CoachResponseSchema = z.object({
  reply_norsk: z.string(),
  reply_l1: z.string(),
  correction: CorrectionSchema,
  next_hints: z.array(HintSchema)
});

module.exports = {
  CoachRequestSchema,
  CoachResponseSchema
};

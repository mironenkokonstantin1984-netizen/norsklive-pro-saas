import { z } from 'zod';

export const WordPosSchema = z.enum([
  'noun',
  'verb',
  'adj',
  'adv',
  'pron',
  'prep',
  'conj',
  'phrase'
]);

export const WordGenderSchema = z.enum(['m', 'f', 'n']);

export const WordLevelSchema = z.enum(['A1', 'A2', 'B1']);

export const WordStatusSchema = z.enum(['draft', 'reviewed']);

export const WordTranslationsSchema = z.object({
  ru: z.string().min(1),
  uk: z.string().min(1),
  en: z.string().min(1)
});

export const WordExampleSchema = z.object({
  nb: z.string().min(1),
  ru: z.string().min(1),
  uk: z.string().min(1),
  en: z.string().min(1)
});

export const WordClozeSchema = z.object({
  nb: z
    .string()
    .min(1)
    .refine((s) => s.includes('___'), {
      message: 'Cloze sentence must include the ___ gap placeholder'
    }),
  answer: z.string().min(1),
  accept: z.array(z.string().min(1)).optional(),
  hint_ru: z.string().optional(),
  hint_uk: z.string().optional(),
  hint_en: z.string().optional()
});

export const WordItemSchema = z
  .object({
    id: z.string().min(1),
    lemma: z.string().min(1),
    pos: WordPosSchema,
    gender: WordGenderSchema.optional(),
    forms: z.record(z.string(), z.string()),
    level: WordLevelSchema,
    topics: z.array(z.string().min(1)).min(1),
    translations: WordTranslationsSchema,
    examples: z.array(WordExampleSchema).min(1).max(2),
    cloze: z.array(WordClozeSchema).min(2).max(3),
    status: WordStatusSchema,
    source: z.string().min(1)
  })
  .superRefine((item, ctx) => {
    if (item.pos === 'noun' && !item.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gender'],
        message: 'Nouns must specify gender (m, f, or n)'
      });
    }

    const exampleNormalized = new Set(
      item.examples.map((ex) => ex.nb.trim().toLowerCase())
    );
    item.cloze.forEach((c, idx) => {
      const filled = c.nb.replace('___', c.answer).trim().toLowerCase();
      const raw = c.nb.trim().toLowerCase();
      if (exampleNormalized.has(filled) || exampleNormalized.has(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cloze', idx, 'nb'],
          message: 'Cloze sentence must differ from examples'
        });
      }
    });
  });

export const WordDatasetSchema = z.array(WordItemSchema);

export type WordPos = z.infer<typeof WordPosSchema>;
export type WordGender = z.infer<typeof WordGenderSchema>;
export type WordLevel = z.infer<typeof WordLevelSchema>;
export type WordStatus = z.infer<typeof WordStatusSchema>;
export type WordTranslations = z.infer<typeof WordTranslationsSchema>;
export type WordExample = z.infer<typeof WordExampleSchema>;
export type WordCloze = z.infer<typeof WordClozeSchema>;
export type WordItem = z.infer<typeof WordItemSchema>;

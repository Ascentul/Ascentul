import { z } from 'zod';

export const applySuggestionSchema = z.object({
  resumeId: z.string().min(1),
  suggestion: z.object({
    id: z.string().min(1),
    blockId: z.string().min(1),
    actionType: z.enum([
      'rewrite_bullet',
      'add_metric',
      'strengthen_verb',
      'fix_tense',
      'expand_summary',
      'condense_text',
    ]),
    severity: z.enum(['critical', 'warning', 'info']),
    message: z.string().min(1),
    detail: z.string().optional(),
    itemIndex: z.number().int().nonnegative().optional(),
    bulletIndex: z.number().int().nonnegative().optional(),
    proposedContent: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),
  editedContent: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
}).superRefine((data, ctx) => {
  if (!data.editedContent && !data.suggestion.proposedContent) {
    ctx.addIssue({
      path: ['suggestion', 'proposedContent'],
      code: z.ZodIssueCode.custom,
      message: 'Suggestion must include proposedContent unless editedContent is provided',
    });
  }
});

export type ApplySuggestionPayload = z.infer<typeof applySuggestionSchema>;

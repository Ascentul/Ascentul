import { z } from 'zod';

export const applySuggestionSchema = z.object({
  resumeId: z.string().min(1),
  suggestion: z.object({
    id: z.string().min(1),
    blockId: z.string().min(1),
    actionType: z.string().min(1),
    itemIndex: z.number().int().nonnegative().optional(),
    proposedContent: z.string().optional(),
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

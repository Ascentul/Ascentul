import { z } from 'zod';

export const goalChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean().default(false),
});

export type GoalChecklistItem = z.infer<typeof goalChecklistItemSchema>;

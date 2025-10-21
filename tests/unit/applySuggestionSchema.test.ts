import { applySuggestionSchema } from '@/app/api/ai/apply-suggestion/schema';

describe('applySuggestionSchema', () => {
  const basePayload = {
    resumeId: 'resume_123',
    suggestion: {
      id: 'suggestion_1',
      blockId: 'block_1',
      actionType: 'rewrite_bullet',
      proposedContent: 'Updated bullet',
    },
  };

  it('accepts a valid payload with proposed content', () => {
    const result = applySuggestionSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
  });

  it('accepts a payload with edited content when proposed content is absent', () => {
    const payload = {
      ...basePayload,
      suggestion: {
        ...basePayload.suggestion,
        proposedContent: undefined,
      },
      editedContent: 'Edited content',
    };
    const result = applySuggestionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects payloads missing both proposedContent and editedContent', () => {
    const payload = {
      ...basePayload,
      suggestion: {
        ...basePayload.suggestion,
        proposedContent: undefined,
      },
    };
    const result = applySuggestionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('must include proposedContent');
    }
  });
});

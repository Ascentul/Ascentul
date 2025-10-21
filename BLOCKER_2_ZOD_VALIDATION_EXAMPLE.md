# BLOCKER #2: Zod Runtime Validation Required

## Problem

Currently, the `/api/ai/stream-suggestions` endpoint relies only on TypeScript types for validation. TypeScript types are compile-time only and **do not protect against runtime errors**.

**What can go wrong:**
```typescript
// TypeScript types say this is safe:
const body: StreamSuggestionsRequest = await req.json();

// But at runtime, body could be:
{ resumeId: null }           // Missing required field
{ resumeId: 123 }            // Wrong type
{ resumeId: "<script>" }     // XSS attempt
{ resumeId: "a".repeat(1e6) } // DoS attack
```

---

## Solution: Add Zod Schemas

### Step 1: Define Schemas

Create `src/lib/validators/ai-streaming.ts`:

```typescript
import { z } from 'zod';

/**
 * Request validation for POST /api/ai/stream-suggestions
 */
export const StreamSuggestionsRequestSchema = z.object({
  resumeId: z.string().min(1).max(100),
  blockIds: z.array(z.string()).optional(),
  targetRole: z.string().max(200).optional(),
  targetCompany: z.string().max(200).optional(),
  maxSuggestions: z.number().int().min(1).max(20).optional().default(5),
});

export type StreamSuggestionsRequest = z.infer<typeof StreamSuggestionsRequestSchema>;

/**
 * Individual suggestion validation
 */
export const AISuggestionSchema = z.object({
  id: z.string().min(1),
  actionType: z.enum([
    'rewrite_bullet',
    'add_metrics',
    'improve_clarity',
    'fix_grammar',
    'strengthen_verb',
  ]),
  severity: z.enum(['high', 'medium', 'low', 'info']),
  message: z.string().min(1).max(500),
  detail: z.string().max(2000).optional(),
  blockId: z.string().optional(),
  itemIndex: z.number().int().min(0).optional(),
  proposedContent: z.string().max(5000).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type AISuggestion = z.infer<typeof AISuggestionSchema>;

/**
 * OpenAI response validation
 */
export const OpenAIResponseSchema = z.object({
  suggestions: z.array(AISuggestionSchema).min(1).max(20),
});
```

---

### Step 2: Use in API Route

Update `src/app/api/ai/stream-suggestions/route.ts`:

```typescript
import { StreamSuggestionsRequestSchema, AISuggestionSchema } from '@/lib/validators/ai-streaming';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // ... existing auth checks ...

    // ✅ ADD: Runtime validation
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // ✅ ADD: Zod validation
    const validationResult = StreamSuggestionsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logEvent('api_validation_failed', {
        endpoint: 'stream-suggestions',
        errors: validationResult.error.errors,
      });

      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { resumeId, blockIds, targetRole, targetCompany, maxSuggestions } = validationResult.data;

    // ... rest of handler ...
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    // ... existing error handling ...
  }
}
```

---

### Step 3: Validate OpenAI Response

In the `parseSuggestions` function:

```typescript
function parseSuggestions(text: string): AISuggestion[] {
  try {
    // ... existing parsing logic ...

    const parsed = JSON.parse(jsonStr);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

    // ✅ ADD: Validate each suggestion
    const validatedSuggestions: AISuggestion[] = [];

    for (const suggestion of suggestions) {
      const result = AISuggestionSchema.safeParse(suggestion);

      if (result.success) {
        validatedSuggestions.push(result.data);
      } else {
        console.warn('[parseSuggestions] Invalid suggestion:', result.error.errors);
        logEvent('ai_response_invalid', {
          errors: result.error.errors,
        });
      }
    }

    return validatedSuggestions;
  } catch (error) {
    console.error('[parseSuggestions] Failed to parse:', error);
    return [];
  }
}
```

---

### Step 4: Client-Side Validation

Update `src/lib/ai/streaming/types.ts`:

```typescript
import { z } from 'zod';
import { AISuggestionSchema, StreamSuggestionsRequestSchema } from '@/lib/validators/ai-streaming';

// Re-export for consistency
export type AISuggestion = z.infer<typeof AISuggestionSchema>;
export type StreamSuggestionsRequest = z.infer<typeof StreamSuggestionsRequestSchema>;

// Validate suggestions before using in UI
export function validateSuggestion(data: unknown): AISuggestion | null {
  const result = AISuggestionSchema.safeParse(data);
  return result.success ? result.data : null;
}
```

---

## Benefits

### Before (Type-only)
```typescript
// ❌ Runtime: crashes if resumeId is wrong type
const { resumeId } = await req.json();
console.log(resumeId.toUpperCase()); // TypeError if resumeId is number
```

### After (Zod)
```typescript
// ✅ Runtime: validates and returns clear error
const result = StreamSuggestionsRequestSchema.safeParse(await req.json());
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
const { resumeId } = result.data; // Guaranteed to be valid string
```

---

## Testing

Add validation tests:

```typescript
// tests/api/stream-suggestions.validation.test.ts
import { StreamSuggestionsRequestSchema } from '@/lib/validators/ai-streaming';

describe('StreamSuggestionsRequestSchema', () => {
  it('should accept valid request', () => {
    const valid = {
      resumeId: 'resume_123',
      blockIds: ['block_1'],
      targetRole: 'Software Engineer',
    };

    const result = StreamSuggestionsRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject missing resumeId', () => {
    const invalid = { blockIds: [] };
    const result = StreamSuggestionsRequestSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['resumeId']);
    }
  });

  it('should reject XSS attempts', () => {
    const xss = {
      resumeId: '<script>alert("xss")</script>',
    };

    const result = StreamSuggestionsRequestSchema.safeParse(xss);
    // Length check will catch this
    expect(result.success).toBe(false);
  });

  it('should reject oversized payloads', () => {
    const dos = {
      resumeId: 'a'.repeat(10000),
    };

    const result = StreamSuggestionsRequestSchema.safeParse(dos);
    expect(result.success).toBe(false);
  });
});
```

---

## Checklist

- [ ] Create `src/lib/validators/ai-streaming.ts` with Zod schemas
- [ ] Update API route to use `safeParse()` for request validation
- [ ] Update `parseSuggestions()` to validate OpenAI responses
- [ ] Add client-side validation helper
- [ ] Write validation tests
- [ ] Update TypeScript types to use `z.infer<>`
- [ ] Add telemetry for validation failures
- [ ] Document validation errors in API docs

---

**Estimated Time:** 4-8 hours
**Priority:** CRITICAL - Blocker #2
**Owner:** API team

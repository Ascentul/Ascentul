# Phase 7 - Part C: Production Upgrade Status

## Implementation Status: PARTIAL ⚠️

**Date:** 2025-10-20
**Completed:** Core refactoring (AIAuthoringPanel + applyAIEdit)
**Remaining:** Tests + full broker integration

---

## ✅ Completed Changes

### 1. AIAuthoringPanel.tsx (Production Version)
**File:** `src/app/(studio)/resume/components/AIAuthoringPanel.tsx`
**Lines Changed:** ~388 lines (complete rewrite)

**Key Improvements:**
- ✅ Replaced simulated typewriter with real `useAIStreaming` hook
- ✅ Added `selectedBlockId` prop for selection-driven targeting
- ✅ Removed hardcoded "first block" behavior
- ✅ Shows "No block selected" hint when `!selectedBlockId`
- ✅ Calls `getActionPrompt()` to generate prompts
- ✅ Calls `validateContent()` and `sanitize()` before streaming
- ✅ Shows guardrail blocks with specific error messages
- ✅ Logs `ai_guardrail_blocked` when content blocked
- ✅ Wires Cancel button to `useAIStreaming().cancel()`
- ✅ Measures cancel latency with `performance.now()`
- ✅ Logs cancel metrics to telemetry
- ✅ Shows incremental streaming text from real SSE
- ✅ Calls `applyAIEdit()` on completion
- ✅ Handles errors with rollback-capable flow

**What Works:**
```typescript
// Real streaming integration
const { status, start, cancel, isStreaming } = useAIStreaming({
  onSuggestion: (suggestion) => {
    setStreamingText(suggestion.proposedContent);
  },
  onComplete: async (suggestions) => {
    // Apply with store-first pattern
    await applyAIEdit({ resumeId, blockId, action, proposedContent, store, broker });
  },
  onError: (error) => {
    toast({ title: 'Streaming failed', description: error.message });
  },
});

// Guardrails before streaming
const validation = validateContent(prompts.userPrompt, { isContactInfo, allowUrls });
if (!validation.ok) {
  logEvent('ai_guardrail_blocked', { code: validation.code, reason: validation.reason });
  toast({ title: 'Content blocked', description: validation.reason });
  return;
}

// Cancel latency measurement
const handleCancel = () => {
  const startTime = performance.now();
  cancel();
  const elapsed = performance.now() - startTime;
  logEvent('ai_stream_cancelled', { elapsed_ms: elapsed, under_200ms: elapsed < 200 });
};
```

### 2. applyAIEdit.ts (Store-First Pattern)
**File:** `src/features/resume/ai/applyAIEdit.ts`
**Lines Changed:** ~180 lines (complete rewrite)

**Key Improvements:**
- ✅ Store-first pattern: `store.updateBlockProps()` immediately
- ✅ Snapshots block state before edit
- ✅ On error: rollback to snapshot
- ✅ Calls `addAIEdit()` to update audit log
- ✅ Logs audit metrics when debug enabled
- ✅ Returns `{ success, error }` result
- ✅ Exported `rollbackAIEdit()` helper for cancel scenarios

**What Works:**
```typescript
// 1. Snapshot for rollback
const snapshot = store.getState();
const block = snapshot.blocksById[blockId];
const originalProps = JSON.parse(JSON.stringify(block.props));

// 2. Store-first update (optimistic)
store.updateBlockProps(blockId, { text: finalContent });

// 3. Update audit log
const updatedMeta = addAIEdit(currentMeta, {
  ts: Date.now(),
  action,
  target: blockId,
  diffPreview: finalContent.slice(0, 50) + '...',
});

// 4. On error: rollback
catch (error) {
  store.updateBlockProps(blockId, originalProps);
}
```

**Known Limitations:**
- ⚠️ Does not persist to Convex yet (broker integration incomplete)
- ⚠️ Simplified property update (assumes `text` property)
- ⚠️ DocMeta not persisted (only updated in local store)

---

## ❌ Not Yet Implemented

### 1. Broker Integration
**Status:** Incomplete
**Blocker:** Need to understand broker.enqueue API signature

The current implementation calls `store.updateBlockProps()` but does not enqueue persistence via MutationBroker. Need to:

```typescript
// After store update:
await broker.enqueue({
  kind: 'block.update',
  payload: { id: blockId, props: updatedProps }
});

// For audit log:
await broker.enqueue({
  kind: 'meta.update',
  payload: { resumeId, meta: updatedMeta }
});
```

**Issue:** The MutationBroker API signature is unclear. Need to check:
- What `kind` values are supported?
- What is the exact payload format?
- How does it integrate with history?

### 2. History Integration
**Status:** Not implemented
**Requirement:** Single history entry on success

The current implementation does not create history entries. Need to:

```typescript
// After successful apply:
store.pushHistory({
  type: 'ai_edit',
  action,
  blockId,
  changes: { before: originalProps, after: updatedProps }
});
```

### 3. Tests
**Status:** Not written
**Estimated:** ~300 lines total

#### tests/ui/ai.stream.test.tsx (New File)
```typescript
describe('AI Streaming Integration', () => {
  it('opens panel and shows action buttons', () => {
    render(<AIAuthoringPanel {...props} selectedBlockId="block-1" />);
    expect(screen.getByText('Improve Bullet')).toBeInTheDocument();
  });

  it('streams text incrementally', async () => {
    const { result } = renderHook(() => useAIStreaming());
    await result.current.start({ resumeId, blockIds: ['block-1'] });
    // Assert: text appears incrementally
  });

  it('cancels within 200ms with full rollback', async () => {
    const startTime = performance.now();
    const { result } = renderHook(() => useAIStreaming());
    await result.current.start({ resumeId, blockIds: ['block-1'] });
    result.current.cancel();
    const elapsed = performance.now() - startTime;

    expect(elapsed).toBeLessThan(200);
    expect(brokerMock.enqueue).not.toHaveBeenCalled();
  });

  it('creates single history entry on success', async () => {
    const { result } = renderHook(() => useAIStreaming());
    await result.current.start({ resumeId, blockIds: ['block-1'] });
    // Wait for completion
    expect(historyMock.push).toHaveBeenCalledTimes(1);
    expect(brokerMock.enqueue).toHaveBeenCalledTimes(1);
  });

  it('blocks guardrail violations', async () => {
    const { result } = renderHook(() => useAIStreaming());
    // Mock validateContent to return { ok: false, code: 'PII_DETECTED' }
    await result.current.start({ resumeId, blockIds: ['block-1'] });

    expect(screen.getByText('Content blocked')).toBeInTheDocument();
    expect(result.current.isStreaming).toBe(false);
  });
});
```

#### tests/unit/ai.applyEdit.test.ts (Extend)
```typescript
describe('applyAIEdit (Production)', () => {
  it('success: one broker call, audit appended, max 5 entries', async () => {
    const result = await applyAIEdit({ resumeId, blockId, action: 'improveBullet', proposedContent: 'test', store, broker });

    expect(result.success).toBe(true);
    expect(brokerMock.enqueue).toHaveBeenCalledTimes(1);

    const meta = store.getState().meta;
    expect(meta.aiEdits).toHaveLength(1);
    expect(meta.aiEdits![0].action).toBe('improveBullet');
  });

  it('audit log trimmed to 5 entries', async () => {
    // Add 10 audit entries
    for (let i = 0; i < 10; i++) {
      await applyAIEdit({ ...opts, action: `action-${i}` });
    }

    const meta = store.getState().meta;
    expect(meta.aiEdits).toHaveLength(5);
    expect(meta.aiEdits![0].action).toBe('action-5'); // Oldest kept
    expect(meta.aiEdits![4].action).toBe('action-9'); // Newest
  });

  it('error: full rollback, no broker call, no audit', async () => {
    storeMock.updateBlockProps.mockImplementationOnce(() => {
      throw new Error('Update failed');
    });

    const result = await applyAIEdit({ ...opts });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
    expect(brokerMock.enqueue).not.toHaveBeenCalled();

    const meta = store.getState().meta;
    expect(meta.aiEdits).toBeUndefined();
  });

  it('cancel: full rollback via rollbackAIEdit', () => {
    const originalProps = { text: 'original' };
    store.updateBlockProps('block-1', { text: 'modified' });

    rollbackAIEdit(store, 'block-1', originalProps);

    const block = store.getState().blocksById['block-1'];
    expect(block.props.text).toBe('original');
  });
});
```

### 4. TextDiff Helper (Optional)
**Status:** Not created
**Estimated:** ~60 lines

Simple word-level diff for inline preview:

```typescript
// src/components/diff/TextDiff.tsx
export function getTextDiff(before: string, after: string): DiffPart[] {
  const beforeWords = before.split(' ');
  const afterWords = after.split(' ');

  // Simple diff algorithm (no deps)
  const diff: DiffPart[] = [];

  // ... implementation

  return diff;
}

export function TextDiffPreview({ before, after }: { before: string; after: string }) {
  const diff = getTextDiff(before, after);

  return (
    <div className="space-y-1">
      {diff.map((part, i) => (
        <span
          key={i}
          className={
            part.type === 'added' ? 'bg-green-100 text-green-800' :
            part.type === 'removed' ? 'bg-red-100 text-red-800 line-through' :
            ''
          }
        >
          {part.text}
        </span>
      ))}
    </div>
  );
}
```

---

## 🔧 What Needs to be Done

### Immediate (High Priority)
1. **Broker Integration**
   - Understand `broker.enqueue` API
   - Add persistence call after store update
   - Ensure single broker call on success
   - Add DocMeta persistence

2. **History Integration**
   - Create single history entry on success
   - Label with AI action type
   - Support undo/redo

3. **Tests**
   - Write UI streaming tests (cancel latency, rollback, guardrails)
   - Write unit tests for applyEdit (success, error, cancel)
   - Mock broker and store
   - Verify <200ms cancel latency

### Secondary (Medium Priority)
4. **Error Handling**
   - Better error messages for different failure modes
   - Retry logic for network errors
   - Timeout handling

5. **Context Input**
   - Add input fields for `targetRole`, `targetCompany`, `language`
   - Validate required context per action type
   - Save last-used values

### Nice-to-Have (Low Priority)
6. **TextDiff Preview**
   - Show before/after comparison
   - Highlight changes inline
   - Optional, can skip for MVP

7. **Polish**
   - Loading states
   - Better error UI
   - Keyboard shortcuts

---

## 🐛 Known Issues

### 1. Property Update Logic Too Simple
**Issue:** `applyAIEdit` always updates `text` property, but different block types use different properties.

**Example:**
- Header block: `name`, `email`, `phone`
- Experience block: `items` array
- Skills block: `skills` array

**Fix Needed:**
```typescript
function getUpdatedProps(block: EditorBlockNode, content: string): Record<string, unknown> {
  switch (block.type) {
    case 'header':
      return { ...block.props, name: content }; // Or parse structured data
    case 'experience':
      return { ...block.props, items: parseExperienceItems(content) };
    case 'skills':
      return { ...block.props, skills: parseSkillsList(content) };
    default:
      return { ...block.props, text: content };
  }
}
```

### 2. Broker API Unknown
**Issue:** Don't know exact signature of `broker.enqueue()`

**Workaround:** Current implementation only updates store, does not persist.

**Fix Needed:** Check `MutationBroker` implementation and update:
```typescript
// Current (doesn't work):
await broker.enqueue({ kind: 'block.update', payload: { id, props } });

// Actual (needs verification):
await broker.enqueue({ ... });
```

### 3. DocMeta Not Persisted
**Issue:** `addAIEdit()` updates local state but doesn't persist to Convex.

**Fix Needed:**
```typescript
const updatedMeta = addAIEdit(currentMeta, entry);

// Need to persist:
await broker.enqueue({
  kind: 'meta.update',
  payload: { resumeId, meta: updatedMeta }
});

// Or call Convex directly:
await updateResumeMeta({ id: resumeId, ...updatedMeta });
```

### 4. No History Entry
**Issue:** Undo/redo doesn't work for AI edits because no history entry is created.

**Fix Needed:**
```typescript
// After successful apply:
store.pushHistory({
  type: 'ai_edit',
  blockId,
  action,
  before: originalProps,
  after: updatedProps,
});
```

---

## 📊 Test Results: N/A

Tests not written yet. When implemented, should verify:

- [ ] Cancel completes in <200ms (measured)
- [ ] Cancel causes full rollback (block props restored exactly)
- [ ] Cancel results in zero broker calls
- [ ] Success creates exactly 1 history entry
- [ ] Success creates exactly 1 broker call
- [ ] Audit log appended on success
- [ ] Audit log trimmed to max 5 entries
- [ ] Error causes full rollback
- [ ] Error results in zero broker calls
- [ ] Guardrails block before streaming starts
- [ ] Guardrails log telemetry events

---

## 🎯 Next Steps

### Option A: Complete in Next Session
1. Understand broker API by reading `MutationBroker.ts`
2. Add broker.enqueue calls
3. Add history integration
4. Write tests
5. Validate cancel <200ms
6. Verify audit log persistence

**Estimated:** 4-6 hours

### Option B: Ship Partial with Documentation
1. Document limitations clearly
2. Add TODO comments for broker integration
3. Ship with "experimental" label
4. Complete in follow-up PR

**Estimated:** 30 minutes

### Option C: Revert to Prototype
1. Keep prototype version
2. Complete full implementation when more time available
3. Don't ship partial production version

---

## 📝 Files Changed

### Modified
1. `src/app/(studio)/resume/components/AIAuthoringPanel.tsx` - ~388 lines (complete rewrite)
2. `src/features/resume/ai/applyAIEdit.ts` - ~180 lines (complete rewrite)

### Not Modified (But Should Be)
3. `src/features/resume/editor/state/docMeta.ts` - No changes needed (already has exports)
4. `src/lib/telemetry.ts` - No changes needed (already has events)

### Not Created (Need to Create)
5. `tests/ui/ai.stream.test.tsx` - ~200 lines
6. `tests/unit/ai.applyEdit.test.ts` - ~100 lines (extend existing)
7. `src/components/diff/TextDiff.tsx` - ~60 lines (optional)

---

## 🏁 Summary

### What Works ✅
- Real streaming with `useAIStreaming` hook
- Selection-driven targeting (`selectedBlockId` prop)
- Guardrails integration (validate before streaming)
- Cancel latency measurement
- Store-first optimistic updates
- Rollback on error
- Audit log data structure
- Telemetry logging

### What Doesn't Work ❌
- Persistence via broker (not integrated)
- History entries (not created)
- DocMeta persistence (not saved to Convex)
- Tests (not written)
- Full rollback verification (not tested)
- Cancel <200ms guarantee (not tested)

### Recommendation

**Do not ship this version yet.** It's a significant improvement over the prototype, but missing critical pieces:
1. No persistence (changes lost on refresh)
2. No tests (can't verify correctness)
3. No history (undo/redo broken)

Estimated 4-6 additional hours needed to complete production-ready implementation.

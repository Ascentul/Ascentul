/**
 * Phase 6: Apply Coach Suggestion
 *
 * Store-first apply flow:
 * 1. Update EditorStore immediately (instant UI feedback)
 * 2. Enqueue persistence via MutationBroker (single call)
 * 3. Single history entry (via store's setSnapshot)
 * 4. On error: keep isDirty=true, surface non-blocking toast
 */

import type { MutationBroker } from '../editor/integration/MutationBroker';
import type { CoachSuggestion } from './suggestions';
import { getValueAtPath, setValueAtPath } from './suggestions';

// EditorStore type (use return type from useEditorStore)
type EditorStore = ReturnType<typeof import('../editor/state/editorStore').useEditorStore>;

export interface ApplySuggestionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface BatchApplyResult {
  applied: number;
  skipped: number;
  skippedReasons: Array<{
    suggestionId: string;
    reason: 'block_not_found' | 'path_not_found';
    blockId?: string;
    targetPath?: string;
  }>;
}

/**
 * Apply a coach suggestion to the editor
 *
 * @param suggestion - The suggestion to apply
 * @param store - EditorStore instance
 * @param broker - MutationBroker for persistence
 * @param options - Optional callbacks
 *
 * @throws Error if suggestion cannot be applied
 */
export async function applySuggestion(
  suggestion: CoachSuggestion,
  store: EditorStore,
  broker: MutationBroker,
  options: ApplySuggestionOptions = {}
): Promise<void> {
  const { onSuccess, onError } = options;

  try {
    // Get current block state
    const currentState = store.getState();
    const block = currentState.blocksById[suggestion.blockId];

    if (!block) {
      throw new Error(`Block ${suggestion.blockId} not found`);
    }

    // Get current value at target path
    const currentValue = getValueAtPath(block, suggestion.targetPath);
    if (currentValue === undefined) {
      throw new Error(`Path ${suggestion.targetPath} not found in block ${suggestion.blockId}`);
    }

    // Generate preview to get the new value
    const diff = suggestion.preview(currentValue);
    const newValue = diff.after;

    // Update block props immutably
    const updatedBlock = setValueAtPath(block, suggestion.targetPath, newValue);

    // Extract just the props for the update
    const newProps = updatedBlock.props;

    // Step 1: Update store immediately (instant UI feedback)
    store.updateBlockProps(suggestion.blockId, newProps);

    // Step 2: Enqueue persistence (single broker call)
    const result = await broker.enqueue({
      kind: 'block.update',
      payload: {
        id: suggestion.blockId,
        props: newProps,
      },
    });

    if (!result.ok) {
      throw result.error;
    }

    // Success callback
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // On error: store remains dirty (isDirty=true already set by updateBlockProps)
    // Error callback will surface a non-blocking toast
    if (onError) {
      onError(err);
    }

    throw err;
  }
}

/**
 * Apply multiple suggestions in a batch
 * Uses updateBlockPropsBatch for atomic update with single history entry
 *
 * @param suggestions - Array of suggestions to apply
 * @param store - EditorStore instance
 * @param broker - MutationBroker for persistence
 * @param options - Optional callbacks
 * @returns Result object with applied/skipped counts and reasons
 */
export async function applySuggestionsBatch(
  suggestions: CoachSuggestion[],
  store: EditorStore,
  broker: MutationBroker,
  options: ApplySuggestionOptions = {}
): Promise<BatchApplyResult> {
  const { onSuccess, onError } = options;

  try {
    const currentState = store.getState();
    const updates: Array<{ blockId: string; changes: Record<string, unknown> }> = [];
    const skippedReasons: BatchApplyResult['skippedReasons'] = [];

    // Prepare all updates, tracking skipped suggestions
    for (const suggestion of suggestions) {
      const block = currentState.blocksById[suggestion.blockId];
      if (!block) {
        console.warn(`[applySuggestionsBatch] Block not found: ${suggestion.blockId}`);
        skippedReasons.push({
          suggestionId: suggestion.id,
          reason: 'block_not_found',
          blockId: suggestion.blockId,
        });
        continue;
      }

      const currentValue = getValueAtPath(block, suggestion.targetPath);
      if (currentValue === undefined) {
        console.warn(`[applySuggestionsBatch] Path not found: ${suggestion.targetPath} in block ${suggestion.blockId}`);
        skippedReasons.push({
          suggestionId: suggestion.id,
          reason: 'path_not_found',
          blockId: suggestion.blockId,
          targetPath: suggestion.targetPath,
        });
        continue;
      }

      const diff = suggestion.preview(currentValue);
      const newValue = diff.after;

      const updatedBlock = setValueAtPath(block, suggestion.targetPath, newValue);
      updates.push({
        blockId: suggestion.blockId,
        changes: updatedBlock.props,
      });
    }

    const result: BatchApplyResult = {
      applied: updates.length,
      skipped: skippedReasons.length,
      skippedReasons,
    };

    if (updates.length === 0) {
      const error = new Error(
        `No valid suggestions to apply. All ${suggestions.length} suggestions were skipped.`
      );
      if (onError) {
        onError(error);
      }
      throw error;
    }

    // Step 1: Batch update store (single history entry)
    store.updateBlockPropsBatch(updates);

    // Step 2: Enqueue persistence for each block
    // Use Promise.allSettled to track individual successes/failures
    const results = await Promise.allSettled(
      updates.map(update =>
        broker.enqueue({
          kind: 'block.update',
          payload: {
            id: update.blockId,
            props: update.changes,
          },
        })
      )
    );

    // Check for failures - collect all errors with their indices
    const failureDetails: Array<{ index: number; blockId: string; error: string }> = [];

    results.forEach((r, index) => {
      const blockId = updates[index]?.blockId || 'unknown';

      if (r.status === 'rejected') {
        failureDetails.push({
          index,
          blockId,
          error: String(r.reason),
        });
      } else if (r.status === 'fulfilled' && !r.value.ok) {
        const value = r.value as { ok: false; error: Error };
        failureDetails.push({
          index,
          blockId,
          error: value.error.message,
        });
      }
    });

    if (failureDetails.length > 0) {
      // Collect detailed error information
      const errorSummaries = failureDetails.map(
        (f) => `  - Block ${f.blockId}: ${f.error}`
      );

      const errorMessage = `Failed to persist ${failureDetails.length}/${updates.length} suggestions:\n${errorSummaries.join('\n')}`;

      // Log comprehensive error details for debugging
      console.error('[applySuggestionsBatch] Persistence failures:', {
        totalUpdates: updates.length,
        succeeded: updates.length - failureDetails.length,
        failed: failureDetails.length,
        failureDetails, // Full details with indices
      });

      // Create custom error that preserves all error information
      const batchError = new Error(errorMessage);

      // Attach all individual errors for programmatic access
      (batchError as any).errors = failureDetails.map((f) => ({
        blockId: f.blockId,
        error: f.error,
        index: f.index,
      }));

      // Note: Store is already updated (optimistic update pattern)
      // isDirty flag will remain true, allowing manual retry
      throw batchError;
    }

    // Log partial success if some suggestions were skipped
    if (result.skipped > 0) {
      console.warn(
        `[applySuggestionsBatch] Partial success: ${result.applied} applied, ${result.skipped} skipped`,
        result.skippedReasons
      );
    }

    if (onSuccess) {
      onSuccess();
    }

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (onError) {
      onError(err);
    }

    throw err;
  }
}

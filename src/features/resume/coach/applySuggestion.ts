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
 */
export async function applySuggestionsBatch(
  suggestions: CoachSuggestion[],
  store: EditorStore,
  broker: MutationBroker,
  options: ApplySuggestionOptions = {}
): Promise<void> {
  const { onSuccess, onError } = options;

  try {
    const currentState = store.getState();
    const updates: Array<{ blockId: string; changes: Record<string, unknown> }> = [];

    // Prepare all updates
    for (const suggestion of suggestions) {
      const block = currentState.blocksById[suggestion.blockId];
      if (!block) continue;

      const currentValue = getValueAtPath(block, suggestion.targetPath);
      if (currentValue === undefined) continue;

      const diff = suggestion.preview(currentValue);
      const newValue = diff.after;

      const updatedBlock = setValueAtPath(block, suggestion.targetPath, newValue);
      updates.push({
        blockId: suggestion.blockId,
        changes: updatedBlock.props,
      });
    }

    if (updates.length === 0) {
      throw new Error('No valid suggestions to apply');
    }

    // Step 1: Batch update store (single history entry)
    store.updateBlockPropsBatch(updates);

    // Step 2: Enqueue persistence for each block
    const results = await Promise.all(
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

    // Check for failures
    const failures = results.filter(r => !r.ok);
    if (failures.length > 0) {
      const firstError = failures[0] as { ok: false; error: Error };
      throw firstError.error;
    }

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (onError) {
      onError(err);
    }

    throw err;
  }
}

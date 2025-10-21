/**
 * Phase 7 - Part C: Client-side Apply AI Edit (Production)
 * Store-first pattern with rollback support and audit log integration
 */

import type { Id } from '../../../../convex/_generated/dataModel';
import type { AIAction } from './actions';
import type { MutationBroker } from '../editor/integration/MutationBroker';
import type { IEditorStoreAdapter } from '../editor/integration/EditorStoreAdapter';
import { addAIEdit } from '../editor/state/docMeta';
import { logEvent } from '@/lib/telemetry';

export interface ApplyAIEditOptions {
  resumeId: Id<'builder_resumes'>;
  blockId: string;
  action: AIAction;
  proposedContent: string;
  editedContent?: string;
  adapter: IEditorStoreAdapter;
  broker: MutationBroker;
}

export interface ApplyAIEditResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
}

/**
 * Apply an AI edit using store-first pattern with rollback
 *
 * Flow:
 * 1. Snapshot current block state
 * 2. Update store immediately (optimistic) - auto-creates history entry
 * 3. Enqueue persistence via broker (single call)
 * 4. Update audit log in memory (max 5 entries)
 * 5. On error: rollback to snapshot
 *
 * @example
 * ```tsx
 * const adapter = createEditorStoreAdapter(store);
 * const result = await applyAIEdit({
 *   resumeId,
 *   blockId: 'block-123',
 *   action: 'improveBullet',
 *   proposedContent: 'Enhanced content',
 *   adapter,
 *   broker,
 * });
 *
 * if (result.ok) {
 *   toast({ title: 'Applied successfully' });
 * }
 * ```
 */
export async function applyAIEdit(options: ApplyAIEditOptions): Promise<ApplyAIEditResult> {
  const {
    resumeId,
    blockId,
    action,
    proposedContent,
    editedContent,
    adapter,
    broker,
  } = options;

  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === 'true';

  // 1. Snapshot current state for rollback
  const snapshot = adapter.snapshotBlock(blockId);

  if (!snapshot) {
    return {
      ok: false,
      error: `Block ${blockId} not found`,
    };
  }

  try {
    if (debugEnabled) {
      logEvent('ai_action_started', {
        action,
        blockId,
        resumeId: String(resumeId),
      });
    }

    // 2. Store-first: Update local store immediately for instant UI feedback
    // This automatically creates a history entry via updateBlockProps
    const finalContent = editedContent ?? proposedContent;

    adapter.setBlockText(blockId, finalContent);

    // 3. Persist via broker (single call)
    const currentText = adapter.getBlockText(blockId);
    if (!currentText) {
      throw new Error('Failed to read updated block text');
    }

    // Enqueue block update
    const mutationResult = await broker.enqueue({
      kind: 'block.update',
      payload: {
        id: blockId,
        text: currentText, // Use the text property for simplicity
      },
    });

    if (!mutationResult.ok) {
      const errorMessage = mutationResult.error instanceof Error
        ? mutationResult.error.message
        : String(mutationResult.error || 'Broker enqueue failed');
      throw new Error(errorMessage);
    }

    // 4. Update audit log in memory
    const currentMeta = adapter.getDocMeta();
    const updatedMeta = addAIEdit(currentMeta, {
      ts: Date.now(),
      action,
      target: blockId,
      diffPreview: finalContent.slice(0, 50) + (finalContent.length > 50 ? '...' : ''),
    });

    adapter.setDocMeta(updatedMeta);

    // Note: DocMeta with aiEdits is memory-only, not persisted to Convex
    // The aiEdits field exists in EditorState.docMeta during the session
    // but is lost on page refresh. This is acceptable for MVP.

    if (debugEnabled) {
      logEvent('ai_action_completed', {
        action,
        blockId,
        resumeId: String(resumeId),
      });

      logEvent('ai_audit_added', {
        action,
        blockId,
        auditCount: updatedMeta.aiEdits?.length ?? 0,
      });
    }

    return { ok: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Rollback to snapshot on error
    try {
      adapter.restoreBlock(blockId, snapshot);
    } catch (rollbackError) {
      console.error('Failed to rollback after error:', rollbackError);
    }

    if (debugEnabled) {
      logEvent('ai_action_failed', {
        action,
        blockId,
        error: err.message,
      });
    }

    return {
      ok: false,
      error: err.message,
    };
  }
}

/**
 * Rollback helper for cancel scenarios
 * Called by AIAuthoringPanel when user cancels before completion
 */
export function rollbackAIEdit(
  adapter: IEditorStoreAdapter,
  blockId: string,
  originalProps: Record<string, unknown>
): void {
  try {
    adapter.restoreBlock(blockId, originalProps);
  } catch (error) {
    console.error('Failed to rollback AI edit:', error);
  }
}

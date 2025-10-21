/**
 * Phase 7 - Part C: EditorStore Adapter
 * Stable API for AI edit operations, abstracting store complexity
 */

import type { EditorState, DocMeta, EditorBlockNode } from '../types/editorTypes';
import type { AIEditEntry } from '../state/docMeta';

/**
 * Stable interface for AI edit operations
 * Hides EditorStore implementation details from AI features
 *
 * ## Null Handling Policy
 *
 * Read operations (queries) are **lenient** - they return `null` for missing blocks:
 * - `getBlockText()` → `null` if block not found
 * - `snapshotBlock()` → `null` if block not found
 * - `getSelectedBlockId()` → `null` if no selection
 *
 * Write operations (commands) are **strict** - they throw errors for missing blocks:
 * - `setBlockText()` → throws Error if block not found
 * - `restoreBlock()` → throws Error if block not found
 *
 * This asymmetry is intentional:
 * - Queries should gracefully handle missing data
 * - Mutations should fail loudly to prevent silent data corruption
 */
export interface IEditorStoreAdapter {
  /**
   * Get text content from a block
   * @param blockId - Block ID to read from
   * @returns Text content, or `null` if block not found (lenient)
   */
  getBlockText(blockId: string): string | null;

  /**
   * Update text content of a block
   *
   * **Supported block types**: `summary`, `custom`
   *
   * **Unsupported block types**: `experience`, `education`, `projects`, `skills`
   * (these require structured data, not plain text)
   *
   * **Partially supported**: `header` (only updates `name` field, ignores email/phone)
   *
   * @param blockId - Block ID to update
   * @param text - New text content
   * @throws {Error} If block not found (strict - fail fast)
   * @throws {Error} If block type doesn't support text editing
   */
  setBlockText(blockId: string, text: string): void;

  /**
   * Get document metadata (memory-only, not persisted to Convex)
   * @returns Current document metadata
   */
  getDocMeta(): DocMeta;

  /**
   * Update document metadata
   * @param meta - New metadata
   * @throws {Error} Not implemented - must use applyAIEdit flow
   */
  updateDocMeta(meta: DocMeta): void;

  /**
   * Get the currently selected block ID
   * @returns Selected block ID, or `null` if no selection (lenient)
   */
  getSelectedBlockId(): string | null;

  /**
   * Create a snapshot of block props for rollback
   * @param blockId - Block ID to snapshot
   * @returns Deep clone of block props, or `null` if block not found (lenient)
   */
  snapshotBlock(blockId: string): Record<string, unknown> | null;

  /**
   * Restore block props from a snapshot
   * @param blockId - Block ID to restore
   * @param props - Props to restore
   * @throws {Error} If block not found (strict - fail fast)
   */
  restoreBlock(blockId: string, props: Record<string, unknown>): void;
}

/**
 * Store-like interface that matches EditorStore methods
 * Used for both real store and mocks
 */
export interface StoreInstance {
  getState: () => EditorState;
  updateBlockProps: (blockId: string, props: Record<string, unknown>) => void;
  updateDocMeta: (meta: DocMeta) => void;
}

/**
 * EditorStore adapter implementation
 * Provides stable API for AI edit operations
 */
export class EditorStoreAdapter implements IEditorStoreAdapter {
  constructor(private store: StoreInstance) {}

  getBlockText(blockId: string): string | null {
    const state = this.store.getState();
    const block = state.blocksById[blockId];

    if (!block) return null;

    // Extract text from different block types
    return this.extractTextFromBlock(block);
  }

  setBlockText(blockId: string, text: string): void {
    const state = this.store.getState();
    const block = state.blocksById[blockId];

    if (!block) {
      throw new Error(`Block ${blockId} not found`);
    }

    // Only simple text blocks support setBlockText
    // Structured blocks (experience, education, projects, skills) require structured data
    const unsupportedTypes = ['experience', 'education', 'projects', 'skills'] as const;
    if (unsupportedTypes.includes(block.type as any)) {
      throw new Error(
        `setBlockText is not supported for block type '${block.type}'. ` +
        `Structured blocks require updating via structured data, not plain text.`
      );
    }

    // Determine which property to update based on block type
    const updatedProps = this.getUpdatedPropsForText(block, text);

    // updateBlockProps automatically creates history entry
    this.store.updateBlockProps(blockId, updatedProps);
  }

  getDocMeta(): DocMeta {
    const state = this.store.getState();
    return state.docMeta;
  }

  updateDocMeta(meta: DocMeta): void {
    this.store.updateDocMeta(meta);
  }

  getSelectedBlockId(): string | null {
    const state = this.store.getState();
    return state.selectedIds[0] ?? null;
  }

  snapshotBlock(blockId: string): Record<string, unknown> | null {
    const state = this.store.getState();
    const block = state.blocksById[blockId];

    if (!block) return null;

    // Deep clone to prevent mutations
    return JSON.parse(JSON.stringify(block.props));
  }

  restoreBlock(blockId: string, props: Record<string, unknown>): void {
    // Restore by updating props (creates history entry)
    this.store.updateBlockProps(blockId, props);
  }

  // Private helpers

  private extractTextFromBlock(block: EditorBlockNode): string {
    const { type, props } = block;

    // Different block types store text in different properties
    switch (type) {
      case 'header':
        return [props.name, props.email, props.phone]
          .filter(Boolean)
          .join(' | ');

      case 'summary':
        return String(props.text ?? '');

      case 'experience':
      case 'education':
      case 'projects':
        if (Array.isArray(props.items)) {
          return props.items
            .map((item: any) => [
              item.title,
              item.company ?? item.institution ?? item.name,
              item.description,
              ...(Array.isArray(item.bullets) ? item.bullets : []),
            ].filter(Boolean).join('\n'))
            .join('\n\n');
        }
        return '';

      case 'skills':
        if (Array.isArray(props.skills)) {
          return props.skills.map((s: any) => s.name ?? s).join(', ');
        }
        return '';

      default:
        return String(props.text ?? '');
    }
  }

  private getUpdatedPropsForText(
    block: EditorBlockNode,
    text: string
  ): Record<string, unknown> {
    const { type, props } = block;

    // Note: setBlockText validates block types before calling this method
    // This switch only handles supported types
    switch (type) {
      case 'header':
        // For header, only update name field (not email/phone)
        // This creates asymmetry with extractTextFromBlock which concatenates all fields
        // TODO: Consider parsing concatenated text back into separate fields
        return { ...props, name: text };

      case 'summary':
      case 'custom':
        // Simple text blocks - update 'text' property
        return { ...props, text };

      default:
        // Should never reach here due to validation in setBlockText
        // but provide fallback for safety
        return { ...props, text };
    }
  }
}

/**
 * Factory function to create adapter from store
 */
export function createEditorStoreAdapter(store: StoreInstance): IEditorStoreAdapter {
  return new EditorStoreAdapter(store);
}

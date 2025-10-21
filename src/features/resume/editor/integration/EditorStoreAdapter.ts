/**
 * Phase 7 - Part C: EditorStore Adapter
 * Stable API for AI edit operations, abstracting store complexity
 */

import type { EditorState, DocMeta, EditorBlockNode } from '../types/editorTypes';
import type { AIEditEntry } from '../state/docMeta';

/**
 * Stable interface for AI edit operations
 * Hides EditorStore implementation details from AI features
 */
export interface IEditorStoreAdapter {
  // Block operations
  getBlockText(blockId: string): string | null;
  setBlockText(blockId: string, text: string): void;

  // DocMeta operations (memory-only, not persisted to Convex)
  getDocMeta(): DocMeta;
  updateDocMeta(meta: DocMeta): void;

  // Selection
  getSelectedBlockId(): string | null;

  // Snapshot/restore for rollback
  snapshotBlock(blockId: string): Record<string, unknown> | null;
  restoreBlock(blockId: string, props: Record<string, unknown>): void;
}

/**
 * Store-like interface that matches EditorStore methods
 * Used for both real store and mocks
 */
export interface StoreInstance {
  getState: () => EditorState;
  updateBlockProps: (blockId: string, props: Record<string, unknown>) => void;
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
    throw new Error('updateDocMeta is not implemented. DocMeta updates must be handled through the applyAIEdit flow.');
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
      case 'objective':
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

    // For simplicity, most blocks use 'text' property
    // More complex block types would need structured parsing
    switch (type) {
      case 'header':
        // For header, keep existing structure and only update name
        return { ...props, name: text };

      case 'experience':
      case 'education':
      case 'projects':
        // For structured blocks, keep existing items structure
        // Real implementation would need to parse text into items
        return props;

      case 'skills':
        // For skills, keep existing structure
        return props;

      default:
        // For simple text blocks (summary, objective, etc.)
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

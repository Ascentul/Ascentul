import type { Id } from '../../../../../../convex/_generated/dataModel';
import type { Block as ConvexBlock } from '@/lib/resume-types';
import type { PageSize } from '@/lib/resume-layout';
import type { AIEditEntry } from '../state/docMeta';

export type BlockId = string;
export type PageId = string;
export type RegionId = string;

/**
 * Region specification for layout definitions.
 * Phase 5: Simplified region model (Main + Overflow virtual region).
 * Future phases can extend with multi-column layouts.
 */
export interface RegionSpec {
  id: RegionId;
  label?: string;
  /** Semantic hint for automatic block assignment (e.g., 'header', 'sidebar', 'main') */
  semantic?: string;
}

export interface EditorBlockNode {
  id: BlockId;
  type: ConvexBlock['type'];
  parentId: PageId | null;
  props: Record<string, unknown>;
  children?: BlockId[];
}

export interface EditorPageNode {
  id: PageId;
  size: PageSize;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  blockIds: BlockId[];
}

export interface DocMeta {
  resumeId: Id<'builder_resumes'>;
  title: string;
  templateSlug?: string;
  themeId?: Id<'builder_resume_themes'>;
  updatedAt: number;
  lastSyncedAt: number;
  version: number;
  aiEdits?: AIEditEntry[]; // Phase 7 - Part C: AI edit audit log (max 5 entries, memory-only)
}

export interface EditorSnapshot {
  blocksById: Record<BlockId, EditorBlockNode>;
  pagesById: Record<PageId, EditorPageNode>;
  pageOrder: PageId[];
  selectedIds: BlockId[];
  docMeta: DocMeta;
  isDirty: boolean;
  lastChangedAt: number;
}

export interface EditorState extends EditorSnapshot {
  canUndo: boolean;
  canRedo: boolean;
}

export type StructuralChange =
  | { type: 'create'; blockId: BlockId }
  | { type: 'delete'; blockId: BlockId }
  | { type: 'reorder'; pageId: PageId }
  | { type: 'page-metadata'; pageId: PageId }
  | { type: 'doc-meta' }
  | { type: 'layout-switch'; layoutId: string }
  | { type: 'theme-switch'; themeId: Id<'builder_resume_themes'> | undefined };

export type PropertyChange =
  | { type: 'block-prop'; blockId: BlockId; propKey: string }
  | { type: 'selection' };

export type HistoryChangeMeta = StructuralChange | PropertyChange;

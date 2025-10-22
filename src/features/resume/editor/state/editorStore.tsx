import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import type { Block as ConvexBlock } from '@/lib/resume-types';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { PAGE_CONFIGS, type PageSize } from '@/lib/resume-layout';
import {
  type BlockId,
  type PageId,
  type EditorBlockNode,
  type EditorPageNode,
  type DocMeta,
  type EditorSnapshot,
  type EditorState,
  type HistoryChangeMeta,
} from '../types/editorTypes';
import {
  canRedo,
  canUndo,
  createHistoryState,
  pushHistory,
  redoHistory,
  replacePresent,
  undoHistory,
  type HistoryState,
} from './history';
import { createPage as createPageAction } from '../../../../app/(studio)/resume/actions/pages/createPage';
import { duplicatePage as duplicatePageAction } from '../../../../app/(studio)/resume/actions/pages/duplicatePage';
import { reflowPages as reflowPagesAction } from '../../../../app/(studio)/resume/actions/pages/reflow';
import type { Page } from '@/types/resume';
import type { LayoutDefinition } from '@/lib/templates';
import { applyLayoutSwitch } from '../layout/applyLayoutSwitch';

export interface ResumeHydrationInput {
  resume: {
    _id: Id<'builder_resumes'>;
    title?: string;
    templateSlug?: string;
    themeId?: Id<'builder_resume_themes'>;
    updatedAt?: number;
    version?: number;
    pages?: Array<{
      id: string;
      size?: PageSize;
      margins?: Partial<EditorPageNode['margins']>;
      blocks?: string[];
    }>;
  } | null;
  blocks: ConvexBlock[];
}

type Listener = () => void;

const warnOnce = (() => {
  const warned = new Set<string>();
  return (key: string, message: string) => {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(message);
  };
})();

const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const defaultMargins = (size: PageSize) => {
  const config = PAGE_CONFIGS[size] ?? PAGE_CONFIGS.Letter;
  return deepClone(config.margins);
};

export const hydrateFromServer = (input: ResumeHydrationInput): EditorSnapshot => {
  if (!input.resume) {
    throw new Error('hydrateFromServer: resume payload missing');
  }
  const resume = input.resume;
  const blocks = input.blocks ?? [];

  const pagesById: Record<PageId, EditorPageNode> = {};
  const pageOrder: PageId[] = [];

  const blockToPage = new Map<BlockId, PageId>();

  const resumePages = resume.pages ?? [];
  resumePages.forEach((page) => {
    const pageId = page.id;
    if (!pageId) {
      warnOnce('missing-page-id', 'Encountered page without id during hydration.');
      return;
    }
    const size: PageSize = page.size ?? 'Letter';
    const margins = {
      ...defaultMargins(size),
      ...page.margins,
    };
    const blockIds = Array.isArray(page.blocks) ? [...page.blocks] : [];
    blockIds.forEach((blockId) => blockToPage.set(blockId, pageId));
    pagesById[pageId] = {
      id: pageId,
      size,
      margins,
      blockIds,
    };
    pageOrder.push(pageId);
  });

  const blocksById: Record<BlockId, EditorBlockNode> = {};
  blocks.forEach((block) => {
    const id = block._id;
    const parentId = blockToPage.get(id) ?? null;
    blocksById[id] = {
      id,
      type: block.type,
      parentId,
      props: deepClone(block.data ?? {}) as Record<string, unknown>,
      children: undefined,
    };
  });

  // Ensure page blocks only reference hydrated blocks
  Object.values(pagesById).forEach((page) => {
    page.blockIds = page.blockIds.filter((blockId) => {
      if (!blocksById[blockId]) {
        warnOnce(
          `missing-block-${blockId}`,
          `Page ${page.id} referenced unknown block ${blockId}, removing from hydration.`,
        );
        return false;
      }
      return true;
    });
  });

  const updatedAt = resume.updatedAt ?? Date.now();
  const docMeta: DocMeta = {
    resumeId: resume._id,
    title: resume.title ?? 'Untitled resume',
    templateSlug: resume.templateSlug ?? undefined,
    themeId: resume.themeId ?? undefined,
    updatedAt,
    lastSyncedAt: updatedAt,
    version: resume.version ?? 0,
  };

  const snapshot: EditorSnapshot = {
    blocksById,
    pagesById,
    pageOrder: pageOrder.length > 0 ? pageOrder : [],
    selectedIds: [],
    docMeta,
    isDirty: false,
    lastChangedAt: Date.now(),
  };

  return snapshot;
};

export class EditorStore {
  private state: EditorState;
  private history: HistoryState;
  private listeners: Set<Listener> = new Set();

  constructor(initialSnapshot: EditorSnapshot) {
    this.history = createHistoryState(initialSnapshot, { type: 'doc-meta' });
    this.state = this.enrichSnapshot(initialSnapshot);
  }

  private enrichSnapshot(snapshot: EditorSnapshot): EditorState {
    return {
      ...snapshot,
      canUndo: canUndo(this.history),
      canRedo: canRedo(this.history),
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): EditorState {
    return this.state;
  }

  private syncHistory(snapshot: EditorSnapshot, meta: HistoryChangeMeta) {
    this.history = pushHistory(this.history, snapshot, meta);
  }

  private setSnapshot(snapshot: EditorSnapshot, meta: HistoryChangeMeta) {
    this.syncHistory(snapshot, meta);
    this.state = this.enrichSnapshot(snapshot);
    this.emit();
  }

  private applySnapshot(snapshot: EditorSnapshot) {
    this.state = this.enrichSnapshot(snapshot);
    this.emit();
  }

  select(ids: BlockId[]) {
    if (ids.length === this.state.selectedIds.length && ids.every((id, index) => this.state.selectedIds[index] === id)) {
      return;
    }
    const snapshot: EditorSnapshot = {
      ...this.state,
      selectedIds: ids,
      lastChangedAt: Date.now(),
    };
    this.setSnapshot(snapshot, { type: 'selection' });
  }

  clearSelection() {
    if (this.state.selectedIds.length === 0) {
      return;
    }
    const snapshot: EditorSnapshot = {
      ...this.state,
      selectedIds: [],
      lastChangedAt: Date.now(),
    };
    this.setSnapshot(snapshot, { type: 'selection' });
  }

  createBlock(block: EditorBlockNode, pageId: PageId, index?: number) {
    const page = this.state.pagesById[pageId];
    if (!page) {
      throw new Error(`createBlock: unknown pageId ${pageId}`);
    }
    if (this.state.blocksById[block.id]) {
      throw new Error(`createBlock: block ${block.id} already exists`);
    }

    const nextBlocks = {
      ...this.state.blocksById,
      [block.id]: { ...block, parentId: pageId },
    };
    const nextPages = {
      ...this.state.pagesById,
      [pageId]: {
        ...page,
        blockIds: (() => {
          const ids = [...page.blockIds];
          const insertAt = typeof index === 'number' ? Math.max(0, Math.min(index, ids.length)) : ids.length;
          ids.splice(insertAt, 0, block.id);
          return ids;
        })(),
      },
    };

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: nextBlocks,
      pagesById: nextPages,
      selectedIds: [block.id],
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'create', blockId: block.id });
  }

  updateBlockProps(blockId: BlockId, changes: Record<string, unknown>) {
    const block = this.state.blocksById[blockId];
    if (!block) {
      throw new Error(`updateBlockProps: unknown block ${blockId}`);
    }

    // Check if any values actually changed
    let hasChanges = false;
    for (const key in changes) {
      if (!Object.is(block.props[key], changes[key])) {
        hasChanges = true;
        break;
      }
    }
    if (!hasChanges) {
      return;
    }
    
    const nextProps = { ...block.props, ...changes };

    const keys = Object.keys(changes);
    const propKey = keys.length === 1 ? keys[0] : keys.join('|');

    const nextBlocks = {
      ...this.state.blocksById,
      [blockId]: {
        ...block,
        props: nextProps,
      },
    };

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: nextBlocks,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'block-prop', blockId, propKey });
  }

  updateBlockPropsBatch(updates: Array<{ blockId: BlockId; changes: Record<string, unknown> }>) {
    if (updates.length === 0) {
      return;
    }

    // Single update optimization
    if (updates.length === 1) {
      this.updateBlockProps(updates[0].blockId, updates[0].changes);
      return;
    }

    // Batch update: apply all changes atomically
    const nextBlocks = { ...this.state.blocksById };
    const affectedBlockIds: BlockId[] = [];
    const allPropKeys: string[] = [];

    for (const { blockId, changes } of updates) {
      const block = nextBlocks[blockId];
      if (!block) {
        throw new Error(`updateBlockPropsBatch: unknown block ${blockId}`);
      }

      const nextProps = { ...block.props, ...changes };
      
      // Check if any values actually changed
      let hasChanges = false;
      for (const key in changes) {
        if (!Object.is(block.props[key], changes[key])) {
          hasChanges = true;
          break;
        }
      }
      
      if (hasChanges) {
        nextBlocks[blockId] = { ...block, props: nextProps };
        affectedBlockIds.push(blockId);

        const keys = Object.keys(changes);
        allPropKeys.push(keys.length === 1 ? keys[0] : keys.join('|'));
      }
    }

    // No actual changes
    if (affectedBlockIds.length === 0) {
      return;
    }

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: nextBlocks,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    // Use first affected block for history metadata
    const primaryBlockId = affectedBlockIds[0];
    const propKey = affectedBlockIds.length === 1 ? allPropKeys[0] : 'batch:' + allPropKeys.join(',');

    this.setSnapshot(snapshot, { type: 'block-prop', blockId: primaryBlockId, propKey });
  }

  deleteBlock(blockId: BlockId) {
    const block = this.state.blocksById[blockId];
    if (!block) {
      return;
    }
    const pageId = block.parentId;
    const nextBlocks = { ...this.state.blocksById };
    delete nextBlocks[blockId];

    const nextPages = { ...this.state.pagesById };
    if (pageId && nextPages[pageId]) {
      nextPages[pageId] = {
        ...nextPages[pageId],
        blockIds: nextPages[pageId].blockIds.filter((id) => id !== blockId),
      };
    }

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: nextBlocks,
      pagesById: nextPages,
      selectedIds: this.state.selectedIds.filter((id) => id !== blockId),
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'delete', blockId });
  }

  reorderBlock(pageId: PageId, fromIndex: number, toIndex: number) {
    const page = this.state.pagesById[pageId];
    if (!page) {
      throw new Error(`reorderBlock: unknown page ${pageId}`);
    }
    if (fromIndex === toIndex) return;
    const ids = [...page.blockIds];
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    const nextPages = {
      ...this.state.pagesById,
      [pageId]: {
        ...page,
        blockIds: ids,
      },
    };

    const snapshot: EditorSnapshot = {
      ...this.state,
      pagesById: nextPages,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'reorder', pageId });
  }

  switchLayout(targetLayout: LayoutDefinition) {
    // Apply layout switch orchestrator
    const newSnapshot = applyLayoutSwitch(this.state, targetLayout);

    // Update store with new snapshot (triggers history entry)
    // Note: Reflow is called separately after this via reflowPages if needed
    this.setSnapshot(newSnapshot, { type: 'layout-switch', layoutId: targetLayout.id });
  }

  pushHistory(meta: HistoryChangeMeta) {
    const snapshot: EditorSnapshot = {
      ...this.state,
    };
    this.setSnapshot(snapshot, meta);
  }

  undo() {
    const result = undoHistory(this.history);
    if (!result.snapshot) {
      return;
    }
    this.history = result.history;
    this.applySnapshot(result.snapshot);
  }

  redo() {
    const result = redoHistory(this.history);
    if (!result.snapshot) {
      return;
    }
    this.history = result.history;
    this.applySnapshot(result.snapshot);
  }

  // Helper methods for page actions
  private pageRecordFromState(): Record<string, Page> {
    const pages: Record<string, Page> = {};
    Object.values(this.state.pagesById).forEach((page) => {
      pages[page.id] = {
        id: page.id,
        size: page.size,
        margins: { ...page.margins },
        blocks: [...page.blockIds],
      };
    });
    return pages;
  }

  private statePagesFromRecord(pages: Record<string, Page>): Record<PageId, EditorPageNode> {
    const statePages: Record<PageId, EditorPageNode> = {};
    Object.values(pages).forEach((page) => {
      statePages[page.id] = {
        id: page.id,
        size: page.size,
        margins: { ...page.margins },
        blockIds: [...page.blocks],
      };
    });
    return statePages;
  }

  private blockRecordFromState(): Record<string, ConvexBlock> {
    const blocks: Record<string, ConvexBlock> = {};
    Object.values(this.state.blocksById).forEach((block) => {
      // Find the block's frame from any existing page
      let frame: ConvexBlock['frame'] = undefined;

      // Try to find frame info if the block is on a page
      if (block.parentId) {
        const page = this.state.pagesById[block.parentId];
        if (page) {
          // For now, frame might not exist in EditorBlockNode
          // This is a simplified conversion - real frame would need layout calculation
          frame = undefined; // Simplified: frame is managed externally
        }
      }

      blocks[block.id] = {
        _id: block.id as unknown as ConvexBlock['_id'],
        resumeId: this.state.docMeta.resumeId,
        type: block.type,
        data: deepClone(block.props) as any,
        order: 0, // Order is managed by blockIds array
        locked: false,
        frame,
      } as ConvexBlock;
    });
    return blocks;
  }

  private stateBlocksFromRecord(blocks: Record<string, ConvexBlock>): Record<BlockId, EditorBlockNode> {
    const stateBlocks: Record<BlockId, EditorBlockNode> = {};
    Object.values(blocks).forEach((block) => {
      // Find parent page from frame.pageId if available
      let parentId: PageId | null = null;
      if (block.frame?.pageId) {
        parentId = block.frame.pageId;
      }

      stateBlocks[block._id] = {
        id: block._id,
        type: block.type,
        parentId,
        props: deepClone(block.data ?? {}) as Record<string, unknown>,
        children: undefined,
      };
    });
    return stateBlocks;
  }

  private getDefaultPageSize(): PageSize {
    if (this.state.pageOrder.length === 0) {
      return 'Letter';
    }
    const firstPage = this.state.pagesById[this.state.pageOrder[0]];
    return firstPage?.size ?? 'Letter';
  }

  // Page action methods
  createPage(size?: PageSize, margins?: EditorPageNode['margins']) {
    const pageSize = size ?? this.getDefaultPageSize();
    const pageMargins = margins ?? defaultMargins(pageSize);

    const result = createPageAction({
      pages: this.pageRecordFromState(),
      pageOrder: this.state.pageOrder,
      size: pageSize,
      margins: pageMargins,
    });

    const snapshot: EditorSnapshot = {
      ...this.state,
      pagesById: this.statePagesFromRecord(result.pages),
      pageOrder: result.pageOrder,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'page-metadata', pageId: result.pageId });
    return result.pageId;
  }

  duplicatePage(pageId: PageId) {
    const result = duplicatePageAction({
      pageId,
      pages: this.pageRecordFromState(),
      pageOrder: this.state.pageOrder,
      blocks: this.blockRecordFromState(),
    });

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: this.stateBlocksFromRecord(result.blocks),
      pagesById: this.statePagesFromRecord(result.pages),
      pageOrder: result.pageOrder,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    this.setSnapshot(snapshot, { type: 'page-metadata', pageId: result.pageId });
    return result.pageId;
  }

  reflowPages(blocksWithHeights: Array<{ block: ConvexBlock; height: number; index: number }>) {
    const pageSize = this.getDefaultPageSize();
    const layout = {
      ...PAGE_CONFIGS[pageSize],
      baseline: 4 as const,
      isCompact: false,
    };

    const result = reflowPagesAction({
      blocksWithHeights,
      pages: this.pageRecordFromState(),
      pageOrder: this.state.pageOrder,
      blocks: this.blockRecordFromState(),
      layout,
      pageSize,
    });

    if (!result.changed) {
      return false;
    }

    const snapshot: EditorSnapshot = {
      ...this.state,
      blocksById: this.stateBlocksFromRecord(result.blocks),
      pagesById: this.statePagesFromRecord(result.pages),
      pageOrder: result.pageOrder,
      isDirty: true,
      lastChangedAt: Date.now(),
    };

    const firstPageId = result.pageOrder[0] ?? this.state.pageOrder[0];
    this.setSnapshot(snapshot, { type: 'page-metadata', pageId: firstPageId });
    return true;
  }

  markSaved(resumeId: Id<'builder_resumes'>, timestamp: number) {
    const snapshot: EditorSnapshot = {
      ...this.state,
      docMeta: {
        ...this.state.docMeta,
        resumeId,
        updatedAt: timestamp,
        lastSyncedAt: timestamp,
      },
      isDirty: false,
    };
    this.history = replacePresent(this.history, snapshot);
    this.applySnapshot(snapshot);
  }

  updateDocMeta(docMeta: DocMeta) {
    const snapshot: EditorSnapshot = {
      ...this.state,
      docMeta,
      lastChangedAt: Date.now(),
    };
    // Don't create history entry for docMeta updates (metadata-only change)
    // Use replacePresent to update current state without affecting undo/redo
    this.history = replacePresent(this.history, snapshot);
    this.applySnapshot(snapshot);
  }
}

const StoreContext = createContext<EditorStore | null>(null);

export const EditorStoreProvider = ({
  initialSnapshot,
  children,
}: PropsWithChildren<{ initialSnapshot: EditorSnapshot }>) => {
  const storeRef = useRef<EditorStore>();
  if (!storeRef.current) {
    storeRef.current = new EditorStore(initialSnapshot);
  }
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
};

export const useEditorStore = (): EditorStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within EditorStoreProvider');
  }
  return store;
};

export const useEditorSelector = <T,>(
  selector: (state: EditorState) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): T => {
  const store = useEditorStore();
  const lastValueRef = useRef<T>(selector(store.getState()));

  const getSnapshot = () => lastValueRef.current;

  const subscribe = (listener: () => void) =>
    store.subscribe(() => {
      const nextValue = selector(store.getState());
      if (!equalityFn(lastValueRef.current, nextValue)) {
        lastValueRef.current = nextValue;
        listener();
      }
    });

  return useSyncExternalStore(subscribe, () => selector(store.getState()), getSnapshot);
};

export const useEditorActions = () => {
  const store = useEditorStore();
  return useMemo(
    () => ({
      select: store.select.bind(store) as (ids: BlockId[]) => void,
      clearSelection: store.clearSelection.bind(store) as () => void,
      createBlock: store.createBlock.bind(store) as (
        block: EditorBlockNode,
        pageId: PageId,
        index?: number,
      ) => void,
      updateBlockProps: store.updateBlockProps.bind(store) as (
        blockId: BlockId,
        changes: Record<string, unknown>,
      ) => void,
      updateBlockPropsBatch: store.updateBlockPropsBatch.bind(store) as (
        updates: Array<{ blockId: BlockId; changes: Record<string, unknown> }>,
      ) => void,
      deleteBlock: store.deleteBlock.bind(store) as (blockId: BlockId) => void,
      reorderBlock: store.reorderBlock.bind(store) as (
        pageId: PageId,
        fromIndex: number,
        toIndex: number,
      ) => void,
      createPage: store.createPage.bind(store) as (size?: PageSize, margins?: EditorPageNode['margins']) => PageId,
      duplicatePage: store.duplicatePage.bind(store) as (pageId: PageId) => PageId,
      reflowPages: store.reflowPages.bind(store) as (
        blocksWithHeights: Array<{ block: ConvexBlock; height: number; index: number }>,
      ) => boolean,
      pushHistory: store.pushHistory.bind(store) as (meta: HistoryChangeMeta) => void,
      undo: store.undo.bind(store) as () => void,
      redo: store.redo.bind(store) as () => void,
      markSaved: store.markSaved.bind(store) as (resumeId: Id<'builder_resumes'>, timestamp: number) => void,
      switchLayout: store.switchLayout.bind(store) as (targetLayout: LayoutDefinition) => void,
    }),
    [store],
  );
};

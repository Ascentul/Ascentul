import { useMemo } from 'react';
import type { BlockId, EditorBlockNode, PageId } from '../types/editorTypes';
import type { BlockData } from '@/lib/resume-types';
import { useEditorSelector } from './editorStore';

export const useSelectedIds = () => useEditorSelector((state) => state.selectedIds);

// Note: Default equality (Object.is) is sufficient for reference comparison
export const useBlocksById = () => useEditorSelector((state) => state.blocksById);

export const usePagesById = () => useEditorSelector((state) => state.pagesById);

export const usePageOrder = () =>
  useEditorSelector((state) => state.pageOrder, (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((id, idx) => id === b[idx]);
  });

export const useDocMeta = () => useEditorSelector((state) => state.docMeta);

export const useIsDirty = () => useEditorSelector((state) => state.isDirty);

export const useCanUndo = () => useEditorSelector((state) => state.canUndo);

export const useCanRedo = () => useEditorSelector((state) => state.canRedo);

// Note: Default equality (Object.is) is sufficient for reference comparison
export const useBlockById = (blockId: BlockId) =>
  useEditorSelector((state) => state.blocksById[blockId]);

/**
 * Subscribe to a specific property of a block for granular updates.
 * Only re-renders when the specific property changes.
 *
 * Note: Uses default Object.is equality (reference comparison)
 *
 * @example
 * const fullName = useBlockProp<string>('block-1', 'fullName');
 */
export const useBlockProp = <T = unknown>(blockId: BlockId, propKey: string): T | undefined => {
  return useEditorSelector((state) => {
    const block = state.blocksById[blockId];
    return block?.props[propKey] as T | undefined;
  });
};

/**
 * Subscribe to the entire data object of a block with type safety.
 * Use this when you need the full block data.
 * Note: In EditorStore, block data is stored directly in props, not in props.data
 *
 * Uses default Object.is equality (reference comparison)
 *
 * @example
 * const headerData = useBlockData<HeaderData>('block-1');
 */
export const useBlockData = <T extends BlockData = BlockData>(blockId: BlockId): T | undefined => {
  return useEditorSelector((state) => {
    const block = state.blocksById[blockId];
    return block?.props as T | undefined;
  });
};

export const useBlocksForPage = (pageId: PageId): EditorBlockNode[] => {
  return useEditorSelector(
    (state) => {
      const page = state.pagesById[pageId];
      if (!page) return [];
      return page.blockIds
        .map((id) => state.blocksById[id])
        .filter((block): block is EditorBlockNode => Boolean(block));
    },
    (a, b) => {
      if (a.length !== b.length) return false;
      // Type guard filter ensures all elements are EditorBlockNode, so optional chaining is unnecessary
      return a.every((block, index) => block.id === b[index].id && block.props === b[index].props);
    },
  );
};

export const useAllBlocks = (): EditorBlockNode[] => {
  const blocksById = useBlocksById();
  const pageOrder = usePageOrder();
  const pagesById = usePagesById();
  return useMemo(() => {
    const ordered: EditorBlockNode[] = [];
    pageOrder.forEach((pageId) => {
      const page = pagesById[pageId];
      if (!page) return;
      page.blockIds.forEach((blockId) => {
        const block = blocksById[blockId];
        if (block) ordered.push(block);
      });
    });
    return ordered;
  }, [blocksById, pageOrder, pagesById]);
};

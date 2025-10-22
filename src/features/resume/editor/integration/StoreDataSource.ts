import { useMemo } from 'react';
import { useEditorStore } from '../state/editorStore';
import type { CanvasDataSource, PageId, Selection, Block, Page } from "./CanvasDataSource";
import type { EditorBlockNode, EditorPageNode } from '../types/editorTypes';

/**
 * Page dimension constants in PostScript points
 *
 * PostScript points: 1 point = 1/72 inch
 * - Letter: 8.5" × 11" = 612 × 792 points
 * - A4: 210mm × 297mm ≈ 595 × 842 points
 */
const PAGE_DIMENSIONS = {
  Letter: { width: 612, height: 792 },
  A4: { width: 595, height: 842 },
} as const;

const DEFAULT_PAGE = 'Letter';

function mapBlockToCanvas(block: EditorBlockNode): Block {
  return {
    id: block.id,
    type: block.type as Block['type'],
    parentId: block.parentId,
    props: block.props,
    children: block.children,
  };
}

function mapPageToCanvas(page: EditorPageNode): Page {
  const config = PAGE_DIMENSIONS[page.size] ?? PAGE_DIMENSIONS[DEFAULT_PAGE];

  return {
    id: page.id,
    size: config,
    margins: page.margins,
    blockIds: page.blockIds,
  };
}

// Factory function for use outside React components
// Returns a data source that will throw if accessed before store is set
export function createStoreDataSource(): CanvasDataSource {
  const notReady = () => {
    throw new Error(
      'StoreDataSource: store not initialized. Use useStoreDataSource() in React components.'
    );
  };

  return {
    getBlocks: notReady as unknown as CanvasDataSource['getBlocks'],
    getPage: notReady as unknown as CanvasDataSource['getPage'],
    getPageOrder: notReady as unknown as CanvasDataSource['getPageOrder'],
    getSelection: notReady as unknown as () => Selection,
    select: notReady as CanvasDataSource['select'],
    onChange: notReady as CanvasDataSource['onChange'],
  };
}

// Hook version that properly initializes with the store
export function useStoreDataSource(): CanvasDataSource {
  const store = useEditorStore();

  return useMemo(() => {
    // Create a stable data source that uses the store
    const dataSource: CanvasDataSource = {
      getBlocks: () => {
        const state = store.getState();
        const mapped: Record<string, Block> = {};

        for (const [id, block] of Object.entries(state.blocksById)) {
          mapped[id] = mapBlockToCanvas(block);
        }

        return mapped;
      },

      getPage: (id: PageId) => {
        const state = store.getState();
        const page = state.pagesById[id];
        return page ? mapPageToCanvas(page) : undefined;
      },

      getPageOrder: () => {
        const state = store.getState();
        return state.pageOrder;
      },

      getSelection: () => {
        const state = store.getState();
        return {
          ids: state.selectedIds,
          lastChangedAt: state.lastChangedAt,
        };
      },

      select: (ids) => {
        store.select(ids);
      },

      onChange: (cb) => {
        return store.subscribe(cb);
      },
    };

    return dataSource;
  }, [store]);
}

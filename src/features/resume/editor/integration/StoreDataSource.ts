import { useEditorStore } from '../state/editorStore';
import type { CanvasDataSource, PageId, Selection, Block, Page } from "./CanvasDataSource";
import type { EditorBlockNode, EditorPageNode } from '../types/editorTypes';

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
  const config = {
    width: page.size === 'Letter' ? 612 : page.size === 'A4' ? 595 : 612,
    height: page.size === 'Letter' ? 792 : page.size === 'A4' ? 842 : 792,
  };

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
  const notReady = () => { throw new Error('StoreDataSource: store not initialized. Use useStoreDataSource() in React components.'); };
  return {
    getBlocks: notReady as any,
    getPage: notReady as any,
    getPageOrder: notReady as any,
    getSelection: notReady as any,
    select: notReady,
    onChange: notReady as any,
  };
}

// Hook version that properly initializes with the store
export function useStoreDataSource(): CanvasDataSource {
  const store = useEditorStore();

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
}

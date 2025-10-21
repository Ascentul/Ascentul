import type { CanvasDataSource, PageId, Selection, Block, Page } from "./CanvasDataSource";

const isDev = process.env.NODE_ENV === 'development';

/**
 * Validates return value and logs warning in development
 */
function validateReturn<T>(value: T, methodName: string, expectation: string): T {
  if (isDev && value == null) {
    console.warn(`[LegacyDataSource] ${methodName} returned null/undefined. Expected: ${expectation}`);
  }
  return value;
}

export function createLegacyDataSource(deps: {
  getBlocksMap: () => Readonly<Record<string, Block>>;
  getPage: (id: PageId) => Page;
  getPageOrder: () => Readonly<PageId[]>;
  getSelection: () => Selection;
  setSelection: (ids: string[]) => void;
  subscribe: (cb: () => void) => () => void;
}): CanvasDataSource {
  // Validate deps methods exist (critical for catching integration errors)
  if (isDev) {
    const requiredMethods = ['getBlocksMap', 'getPage', 'getPageOrder', 'getSelection', 'setSelection', 'subscribe'];
    for (const method of requiredMethods) {
      if (typeof deps[method as keyof typeof deps] !== 'function') {
        console.error(`[LegacyDataSource] Missing or invalid method: ${method}`);
      }
    }
  }

  return {
    getBlocks: () => {
      const blocks = deps.getBlocksMap();
      return validateReturn(blocks, 'getBlocksMap', 'Record<string, Block>');
    },
    getPage: (id) => {
      const page = deps.getPage(id);
      return validateReturn(page, `getPage(${id})`, 'Page object');
    },
    getPageOrder: () => {
      const order = deps.getPageOrder();
      return validateReturn(order, 'getPageOrder', 'PageId[]');
    },
    getSelection: () => {
      const selection = deps.getSelection();
      return validateReturn(selection, 'getSelection', 'Selection object');
    },
    select: (ids) => {
      if (isDev && !Array.isArray(ids)) {
        console.warn('[LegacyDataSource] select() called with non-array:', ids);
      }
      deps.setSelection(ids);
    },
    onChange: (cb) => {
      if (isDev && typeof cb !== 'function') {
        console.error('[LegacyDataSource] onChange() requires a callback function');
      }
      return deps.subscribe(cb);
    },
  };
}

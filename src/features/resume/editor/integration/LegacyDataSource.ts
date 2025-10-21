import type { CanvasDataSource, PageId, Selection, Block } from "./CanvasDataSource";

export function createLegacyDataSource(deps: {
  getBlocksMap: () => Readonly<Record<string, Block>>;
  getPage: (id: PageId) => Page;
  getPageOrder: () => Readonly<PageId[]>;
  getSelection: () => Selection;
  setSelection: (ids: string[]) => void;
  subscribe: (cb: () => void) => () => void;
}): CanvasDataSource {
  return {
    getBlocks: () => deps.getBlocksMap(),
    getPage: (id) => deps.getPage(id),
    getPageOrder: () => deps.getPageOrder(),
    getSelection: () => deps.getSelection(),
    select: (ids) => deps.setSelection(ids),
    onChange: (cb) => deps.subscribe(cb),
  };
}

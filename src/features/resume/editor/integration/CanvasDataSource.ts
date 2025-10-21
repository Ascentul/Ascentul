export type BlockId = string;
export type PageId = string;

export type Block = {
  id: BlockId;
  type: "text" | "heading" | "section" | "image" | "shape";
  parentId: PageId | BlockId | null;
  props: Record<string, unknown>;
  children?: BlockId[];
};

export type Page = {
  id: PageId;
  size: { width: number; height: number };
  margins?: { top: number; right: number; bottom: number; left: number };
  blockIds: BlockId[];
};

export type Selection = { ids: BlockId[]; lastChangedAt: number };

export type CanvasDataSource = {
  getBlocks(): Readonly<Record<BlockId, Block>>;
  getPage(id: PageId): Readonly<Page> | undefined;
  getPageOrder(): Readonly<PageId[]>;
  getSelection(): Readonly<Selection>;
  select(ids: BlockId[]): void;
  onChange(cb: () => void): () => void; // fire on any data change
};

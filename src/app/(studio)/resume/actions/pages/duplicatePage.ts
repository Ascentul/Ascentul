import { v4 as uuidv4 } from 'uuid';
import type { Page } from '@/types/resume';
import type { Block } from '@/lib/resume-types';

export interface DuplicatePageParams {
  pageId: string;
  pages: Record<string, Page>;
  pageOrder: string[];
  blocks: Record<string, Block>;
}

export interface DuplicatePageResult {
  pages: Record<string, Page>;
  pageOrder: string[];
  blocks: Record<string, Block>;
  pageId: string;
}

export function duplicatePage({
  pageId,
  pages,
  pageOrder,
  blocks,
}: DuplicatePageParams): DuplicatePageResult {
  const originalPage = pages[pageId];
  if (!originalPage) {
    throw new Error(`Cannot duplicate page: page with id "${pageId}" not found`);
  }

  const newPageId = uuidv4();

  const newBlocks: Record<string, Block> = { ...blocks };
  const clonedBlockIds: string[] = [];

  let maxOrder = originalPage.blocks.reduce((acc, blockId) => {
    const block = blocks[blockId];
    return block ? Math.max(acc, block.order ?? 0) : acc;
  }, 0);

  for (const blockId of originalPage.blocks) {
    const existingBlock = blocks[blockId];
    if (!existingBlock) continue;

    const clonedId = uuidv4();
    maxOrder += 1;

    newBlocks[clonedId] = {
      ...existingBlock,
      _id: clonedId as unknown as Block['_id'],
      order: maxOrder,
      frame: existingBlock.frame
        ? { ...existingBlock.frame, pageId: newPageId }
        : undefined,
    } as Block;
    clonedBlockIds.push(clonedId);
  }

  const newPage: Page = {
    ...originalPage,
    id: newPageId,
    blocks: clonedBlockIds,
  };

  const newPages = {
    ...pages,
    [newPageId]: newPage,
  };

  const originalIndex = pageOrder.indexOf(pageId);
  const newPageOrder =
    originalIndex === -1
      ? [...pageOrder, newPageId]
      : [
          ...pageOrder.slice(0, originalIndex + 1),
          newPageId,
          ...pageOrder.slice(originalIndex + 1),
        ];

  return {
    pages: newPages,
    pageOrder: newPageOrder,
    blocks: newBlocks,
    pageId: newPageId,
  };
}

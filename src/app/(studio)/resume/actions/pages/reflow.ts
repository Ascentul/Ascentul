import { v4 as uuidv4 } from 'uuid';
import {
  getAvailableContentHeight,
  snapToBaseline,
  pixelsToInches,
  type LayoutConfig,
} from '@/lib/resume-layout';
import type { Page, PageMargins } from '@/types/resume';
import type { Block } from '@/lib/resume-types';

const PAGE_TOLERANCE = 1e-3;

/**
 * Minimum block height in pixels to prevent layout issues with nearly invisible blocks.
 *
 * This value ensures that:
 * - Empty or collapsed blocks still occupy minimal space for selection/interaction
 * - Blocks with zero measured height (e.g., during initial render) don't cause division by zero
 * - Very small content is still measurable and can be reflowed correctly
 *
 * At 0.5 pixels, this translates to approximately 0.0007 inches at 96 DPI,
 * which is effectively invisible but maintains layout integrity.
 */
const MIN_BLOCK_HEIGHT_PX = 0.5;

export interface ReflowParams {
  blocksWithHeights: Array<{
    block: Block;
    height: number;
    index: number;
  }>;
  pages: Record<string, Page>;
  pageOrder: string[];
  blocks: Record<string, Block>;
  layout: LayoutConfig;
  pageSize: Page['size'];
}

export interface ReflowResult {
  pages: Record<string, Page>;
  pageOrder: string[];
  blocks: Record<string, Block>;
  changed: boolean;
  iterations: number;
  log: string[];
}

export function reflowPages({
  blocksWithHeights,
  pages,
  pageOrder,
  blocks,
  layout,
  pageSize,
}: ReflowParams): ReflowResult {
  const log: string[] = [];

  // Defensive clone of block map
  const nextBlocks: Record<string, Block> = {};
  Object.entries(blocks).forEach(([blockId, block]) => {
    nextBlocks[blockId] = {
      ...block,
      frame: block.frame ? { ...block.frame } : undefined,
    };
  });

  const availableHeight = getAvailableContentHeight(layout);
  const contentWidth = layout.pageWidth - layout.margins.left - layout.margins.right;

  // Ensure deterministic order using block.order then fallback to index
  const sorted = [...blocksWithHeights].sort((a, b) => {
    const orderA = a.block.order ?? a.index;
    const orderB = b.block.order ?? b.index;
    if (orderA !== orderB) return orderA - orderB;
    return a.index - b.index;
  });

  const existingPageIds = [...pageOrder];
  const nextPages: Page[] = [];

  let pageCursor = 0;

  const acquirePage = (): { page: Page; margins: PageMargins } => {
    const existingId = existingPageIds[pageCursor];
    pageCursor += 1;

    if (existingId) {
      const existingPage = pages[existingId];
      if (existingPage) {
        return {
          page: {
            id: existingPage.id,
            size: existingPage.size ?? pageSize,
            margins: { ...existingPage.margins },
            blocks: [],
          },
          margins: { ...existingPage.margins },
        };
      }
    }

    const fallbackMargins = { ...layout.margins };
    const newPage: Page = {
      id: uuidv4(),
      size: pageSize,
      margins: fallbackMargins,
      blocks: [],
    };
    return { page: newPage, margins: fallbackMargins };
  };

  const sortedCount = sorted.length;

  const tolerance = PAGE_TOLERANCE;

  let currentPageInfo = acquirePage();
  let currentPage = currentPageInfo.page;
  let currentMargins = currentPageInfo.margins;
  let currentHeight = 0;
  let currentY = 0;

  if (sortedCount === 0) {
    nextPages.push(currentPage);
  } else {
    for (const measured of sorted) {
      const block = measured.block;
      const heightInches = snapToBaseline(
        pixelsToInches(Math.max(measured.height, MIN_BLOCK_HEIGHT_PX)),
        layout.baseline
      );

      const projectedHeight = currentHeight + heightInches;
      const hasBlocksOnPage = currentPage.blocks.length > 0;

      if (hasBlocksOnPage && projectedHeight - availableHeight > tolerance) {
        log.push(
          `Page ${nextPages.length + 1} finalized with ${currentPage.blocks.length} blocks (height ${currentHeight.toFixed(
            2,
          )}in).`,
        );
        nextPages.push(currentPage);
        currentPageInfo = acquirePage();
        currentPage = currentPageInfo.page;
        currentMargins = currentPageInfo.margins;
        currentHeight = 0;
        currentY = 0;
      }

      currentPage.blocks.push(block._id);
      currentHeight += heightInches;

      nextBlocks[block._id] = {
        ...nextBlocks[block._id],
        frame: {
          pageId: currentPage.id,
          x: currentMargins.left,
          y: currentMargins.top + currentY,
          w: contentWidth,
          h: heightInches,
        },
      };

      currentY += heightInches;
    }

    if (currentPage.blocks.length > 0) {
      log.push(
        `Page ${nextPages.length + 1} finalized with ${currentPage.blocks.length} blocks (height ${currentHeight.toFixed(
          2,
        )}in).`,
      );
      nextPages.push(currentPage);
    }
  }

  if (nextPages.length === 0) {
    const fallbackMargins = { ...layout.margins };
    const pageId = existingPageIds[0] ?? uuidv4();
    nextPages.push({
      id: pageId,
      size: pageSize,
      margins: fallbackMargins,
      blocks: [],
    });
  }

  const nextPageOrder = nextPages.map((page) => page.id);
  const nextPagesRecord = nextPages.reduce<Record<string, Page>>((acc, page) => {
    acc[page.id] = page;
    return acc;
  }, {});

  log.unshift(`Reflow pass: ${pageOrder.length} -> ${nextPageOrder.length} pages`);

  let pagesChanged =
    pageOrder.length !== nextPageOrder.length ||
    pageOrder.some((id, index) => nextPageOrder[index] !== id);

  if (!pagesChanged) {
    pagesChanged = nextPageOrder.some((pageId) => {
      const nextPage = nextPagesRecord[pageId];
      const prevPage = pages[pageId];
      if (!prevPage) return true;
      if (nextPage.size !== prevPage.size) return true;
      if (
        Math.abs(nextPage.margins.top - prevPage.margins.top) > tolerance ||
        Math.abs(nextPage.margins.right - prevPage.margins.right) > tolerance ||
        Math.abs(nextPage.margins.bottom - prevPage.margins.bottom) > tolerance ||
        Math.abs(nextPage.margins.left - prevPage.margins.left) > tolerance
      ) {
        return true;
      }
      if (nextPage.blocks.length !== prevPage.blocks.length) return true;
      for (let i = 0; i < nextPage.blocks.length; i += 1) {
        if (nextPage.blocks[i] !== prevPage.blocks[i]) {
          return true;
        }
      }
      return false;
    });
  }

  let blocksChanged = false;
  // Skip block comparison if pages already changed (optimization: changed = pagesChanged || blocksChanged)
  if (!pagesChanged) {
    blocksChanged = Object.entries(nextBlocks).some(([blockId, nextBlock]) => {
      const prevBlock = blocks[blockId];
      if (!prevBlock) return true;
      const prevFrame = prevBlock.frame;
      const nextFrame = nextBlock.frame;
      if (!prevFrame && !nextFrame) return false;
      if (!prevFrame || !nextFrame) return true;
      if (prevFrame.pageId !== nextFrame.pageId) return true;
      if (Math.abs(prevFrame.x - nextFrame.x) > tolerance) return true;
      if (Math.abs(prevFrame.y - nextFrame.y) > tolerance) return true;
      if (Math.abs(prevFrame.w - nextFrame.w) > tolerance) return true;
      if (Math.abs(prevFrame.h - nextFrame.h) > tolerance) return true;
      return false;
    });
  }

  const changed = pagesChanged || blocksChanged;

  return {
    pages: nextPagesRecord,
    pageOrder: nextPageOrder,
    blocks: nextBlocks,
    changed,
    iterations: sortedCount,
    log,
  };
}

/**
 * Resume layout configuration and utilities
 */

export type PageSize = 'A4' | 'Letter';
export type BaselineGrid = 4 | 6;

export interface LayoutConfig {
  pageWidth: number;
  pageHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  baseline: BaselineGrid;
  isCompact: boolean;
}

export interface PageBreak {
  pageNumber: number;
  startBlockIndex: number;
  endBlockIndex: number;
  blocks: any[];
}

export interface BlockWithHeight {
  block: any;
  height: number;
  index: number;
}

/**
 * Default layout configurations for different page sizes
 */
export const PAGE_CONFIGS: Record<PageSize, Omit<LayoutConfig, 'baseline' | 'isCompact'>> = {
  A4: {
    pageWidth: 8.27, // inches
    pageHeight: 11.69, // inches
    margins: {
      top: 0.75,
      right: 0.75,
      bottom: 0.75,
      left: 0.75,
    },
  },
  Letter: {
    pageWidth: 8.5, // inches
    pageHeight: 11, // inches
    margins: {
      top: 0.75,
      right: 0.75,
      bottom: 0.75,
      left: 0.75,
    },
  },
};

/**
 * Convert inches to pixels (96 DPI)
 */
export function inchesToPixels(inches: number): number {
  return inches * 96;
}

/**
 * Convert pixels to inches
 */
export function pixelsToInches(pixels: number): number {
  return pixels / 96;
}

/**
 * Get the available content height for a page
 */
export function getAvailableContentHeight(config: LayoutConfig): number {
  const totalHeight = config.pageHeight;
  const usedHeight = config.margins.top + config.margins.bottom;
  return totalHeight - usedHeight;
}

/**
 * Snap a value to the baseline grid
 */
export function snapToBaseline(value: number, baseline: number): number {
  const baselineInInches = baseline / 96; // Convert px to inches
  return Math.ceil(value / baselineInInches) * baselineInInches;
}

/**
 * Calculate spacing factor based on compact mode
 */
export function getSpacingFactor(isCompact: boolean): number {
  return isCompact ? 0.7 : 1.0;
}

/**
 * Calculate line height factor based on compact mode
 */
export function getLineHeightFactor(isCompact: boolean): number {
  return isCompact ? 0.85 : 1.0;
}

/**
 * Calculate page breaks based on block heights
 */
export function calculatePageBreaks(
  blocksWithHeights: BlockWithHeight[],
  config: LayoutConfig
): PageBreak[] {
  const availableHeight = getAvailableContentHeight(config);
  const pages: PageBreak[] = [];
  let currentPage: PageBreak = {
    pageNumber: 1,
    startBlockIndex: 0,
    endBlockIndex: 0,
    blocks: [],
  };
  let currentPageHeight = 0;

  blocksWithHeights.forEach((item, index) => {
    const blockHeightInInches = pixelsToInches(item.height);
    const snappedHeight = snapToBaseline(blockHeightInInches, config.baseline);

    // Check if adding this block would overflow the page
    if (currentPageHeight + snappedHeight > availableHeight && currentPage.blocks.length > 0) {
      // Finalize current page
      currentPage.endBlockIndex = index - 1;
      pages.push(currentPage);

      // Start new page
      currentPage = {
        pageNumber: pages.length + 1,
        startBlockIndex: index,
        endBlockIndex: index,
        blocks: [],
      };
      currentPageHeight = 0;
    }

    // Add block to current page
    currentPage.blocks.push(item);
    currentPage.endBlockIndex = index;
    currentPageHeight += snappedHeight;
  });

  // Add the last page if it has blocks
  if (currentPage.blocks.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * Get compact mode CSS classes
 */
export function getCompactModeClasses(isCompact: boolean): string {
  if (!isCompact) return '';

  return 'compact-mode';
}

/**
 * Get compact mode inline styles
 */
export function getCompactModeStyles(isCompact: boolean): React.CSSProperties {
  if (!isCompact) return {};

  const spacingFactor = getSpacingFactor(isCompact);
  const lineHeightFactor = getLineHeightFactor(isCompact);

  return {
    '--spacing-factor': spacingFactor.toString(),
    '--line-height-factor': lineHeightFactor.toString(),
  } as React.CSSProperties;
}

/**
 * Calculate total pages needed
 */
export function calculateTotalPages(
  blocksWithHeights: BlockWithHeight[],
  config: LayoutConfig
): number {
  const pageBreaks = calculatePageBreaks(blocksWithHeights, config);
  return pageBreaks.length;
}

/**
 * Get blocks for a specific page
 */
export function getBlocksForPage(
  pageNumber: number,
  blocksWithHeights: BlockWithHeight[],
  config: LayoutConfig
): BlockWithHeight[] {
  const pageBreaks = calculatePageBreaks(blocksWithHeights, config);
  const page = pageBreaks[pageNumber - 1];

  if (!page) return [];

  return page.blocks;
}

/**
 * Check if a block would cause an overflow
 */
export function wouldBlockOverflow(
  currentHeight: number,
  blockHeight: number,
  config: LayoutConfig
): boolean {
  const availableHeight = getAvailableContentHeight(config);
  const blockHeightInInches = pixelsToInches(blockHeight);
  const snappedHeight = snapToBaseline(blockHeightInInches, config.baseline);

  return currentHeight + snappedHeight > availableHeight;
}

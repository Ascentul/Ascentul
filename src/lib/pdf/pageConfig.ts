/**
 * PDF page configuration utilities
 *
 * Handles page size, margins, and dimension calculations for PDF export
 */

/**
 * Template configuration for page layout
 */
export interface TemplateConfig {
  pageSize?: 'Letter' | 'A4';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Page dimensions in CSS units
 */
export interface PageDimensions {
  width: string;
  height: string;
}

/**
 * Margin values in CSS units
 */
export interface PageMargins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

/**
 * Complete page configuration for PDF generation
 */
export interface PageConfig {
  pageSize: 'Letter' | 'A4';
  dimensions: PageDimensions;
  margins: PageMargins;
}

/**
 * Default page margins in pixels (72 pixels = 0.75 inches at 96 DPI)
 */
const DEFAULT_MARGINS = { top: 72, right: 72, bottom: 72, left: 72 };

/**
 * Default page size
 */
const DEFAULT_PAGE_SIZE = 'Letter' as const;

/**
 * Get page dimensions for a given page size
 *
 * @param pageSize - The page size (Letter or A4)
 * @returns Page dimensions in CSS units
 *
 * @example
 * getPageDimensions('Letter')
 * // Returns: { width: '8.5in', height: '11in' }
 *
 * getPageDimensions('A4')
 * // Returns: { width: '210mm', height: '297mm' }
 */
export function getPageDimensions(pageSize: 'Letter' | 'A4'): PageDimensions {
  return pageSize === 'A4'
    ? { width: '210mm', height: '297mm' }
    : { width: '8.5in', height: '11in' };
}

/**
 * Convert pixel margins to CSS inch units
 *
 * Assumes 96 DPI (standard CSS pixel density)
 *
 * @param margins - Margin values in pixels
 * @returns Margin values in CSS inch units
 *
 * @example
 * convertMarginsToInches({ top: 72, right: 72, bottom: 72, left: 72 })
 * // Returns: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' }
 */
export function convertMarginsToInches(margins: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}): PageMargins {
  return {
    top: `${margins.top / 96}in`,
    right: `${margins.right / 96}in`,
    bottom: `${margins.bottom / 96}in`,
    left: `${margins.left / 96}in`,
  };
}

/**
 * Build complete page configuration from template
 *
 * This function implements the actual page configuration logic used in PDF export:
 * - Uses default Letter page size if not specified
 * - Uses default 72px margins if not specified
 * - Converts pixel margins to CSS inch units
 * - Gets appropriate page dimensions for the size
 *
 * @param template - Template configuration (may be undefined or have missing fields)
 * @returns Complete page configuration ready for PDF generation
 *
 * @example
 * buildPageConfig({ pageSize: 'A4', margins: { top: 96, right: 96, bottom: 96, left: 96 } })
 * // Returns: {
 * //   pageSize: 'A4',
 * //   dimensions: { width: '210mm', height: '297mm' },
 * //   margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
 * // }
 *
 * buildPageConfig(undefined)
 * // Returns default Letter configuration with 72px margins
 */
export function buildPageConfig(template: TemplateConfig | undefined): PageConfig {
  const pageSize = template?.pageSize || DEFAULT_PAGE_SIZE;
  const marginsInPixels = template?.margins || DEFAULT_MARGINS;

  return {
    pageSize,
    dimensions: getPageDimensions(pageSize),
    margins: convertMarginsToInches(marginsInPixels),
  };
}

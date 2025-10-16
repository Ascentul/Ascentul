/**
 * Runtime validation for resume document integrity.
 *
 * Validates block-page relationships to maintain data integrity:
 * - Ensures all block IDs in Page.blocks reference existing blocks
 * - Detects orphaned blocks (exist but not referenced by any page)
 * - Prevents duplicate block references across pages
 */

import type { Page } from '@/types/resume';
import type { Block } from './resume-types';

export interface ValidationError {
  type: 'missing_block' | 'orphaned_block' | 'duplicate_reference';
  message: string;
  pageId?: string;
  blockId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates block-page relationships in resume document data.
 *
 * @param pages - Record of pages indexed by page ID
 * @param blocks - Record of blocks indexed by block ID
 * @returns Validation result with errors and warnings
 */
export function validateResumeDocument(
  pages: Record<string, Page>,
  blocks: Record<string, Block>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const allBlockIds = new Set(Object.keys(blocks));
  const blockToPages = new Map<string, Set<string>>();

  // Validate each page's block references
  for (const [pageId, page] of Object.entries(pages)) {
    for (const blockId of page.blocks) {
      // Check if block exists
      if (!allBlockIds.has(blockId)) {
        errors.push({
          type: 'missing_block',
          message: `Page "${pageId}" references non-existent block "${blockId}"`,
          pageId,
          blockId,
        });
      }

      // Track references for duplicate detection
      const pageSet = blockToPages.get(blockId);
      if (pageSet) {
        pageSet.add(pageId);
      } else {
        blockToPages.set(blockId, new Set([pageId]));
      }
    }
  }

  // Check for duplicate block references
  for (const [blockId, pageIds] of blockToPages.entries()) {
    if (pageIds.size > 1) {
      errors.push({
        type: 'duplicate_reference',
        message: `Block "${blockId}" is referenced by ${pageIds.size} pages: ${Array.from(pageIds).join(', ')} (should be exactly 1)`,
        blockId,
      });
    }
  }

  // Check for orphaned blocks
  for (const blockId of allBlockIds) {
    if (!blockToPages.has(blockId)) {
      warnings.push({
        type: 'orphaned_block',
        message: `Block "${blockId}" exists but is not referenced by any page`,
        blockId,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that resume document is valid, throwing an error if not.
 *
 * @param pages - Record of pages indexed by page ID
 * @param blocks - Record of blocks indexed by block ID
 * @throws Error if validation fails
 */
export function assertValidResumeDocument(
  pages: Record<string, Page>,
  blocks: Record<string, Block>
): void {
  const result = validateResumeDocument(pages, blocks);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => e.message).join('\n');
    throw new Error(`Resume document validation failed:\n${errorMessages}`);
  }
}

/**
 * Validates and logs warnings for resume document.
 * Throws on errors, logs warnings to console.
 *
 * @param pages - Record of pages indexed by page ID
 * @param blocks - Record of blocks indexed by block ID
 * @param context - Optional context string for logging
 */
export function validateAndLogResumeDocument(
  pages: Record<string, Page>,
  blocks: Record<string, Block>,
  context = 'Resume document'
): void {
  const result = validateResumeDocument(pages, blocks);

  if (result.warnings.length > 0) {
    console.warn(`${context} validation warnings:`, result.warnings);
  }

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => e.message).join('\n');
    throw new Error(`${context} validation failed:\n${errorMessages}`);
  }
}

/**
 * Resume Document Types
 *
 * Type definitions for resume documents, pages, and blocks
 * Used by the AI Resume Builder and profile-to-resume mapper
 */

import type { Id } from '../../convex/_generated/dataModel';
import type {
  HeaderData,
  SummaryData,
  ExperienceData,
  EducationData,
  SkillsData,
  ProjectsData,
  CustomData,
} from '../lib/resume/types';

/**
 * Discriminated union for type-safe resume blocks
 * Ensures data field matches the block type
 */
export type ResumeBlock =
  | { type: 'header'; data: HeaderData; order: number; locked?: boolean }
  | { type: 'summary'; data: SummaryData; order: number; locked?: boolean }
  | { type: 'experience'; data: ExperienceData; order: number; locked?: boolean }
  | { type: 'education'; data: EducationData; order: number; locked?: boolean }
  | { type: 'skills'; data: SkillsData; order: number; locked?: boolean }
  | { type: 'projects'; data: ProjectsData; order: number; locked?: boolean }
  | { type: 'custom'; data: CustomData; order: number; locked?: boolean };

/**
 * Resume document metadata
 * Matches the builder_resumes table schema in Convex
 */
export interface ResumeDocument {
  /** Resume ID (undefined for new resumes) */
  id?: Id<'builder_resumes'>;

  /** Owner user ID */
  userId?: Id<'users'>;

  /** Resume title */
  title: string;

  /** Template slug (e.g., "modern-minimal") */
  templateSlug: string;

  /** Theme ID (optional) */
  themeId?: Id<'builder_resume_themes'>;

  /** Resume content blocks */
  blocks: ResumeBlock[];

  /** Document version for optimistic concurrency control */
  version?: number;

  /** Creation timestamp (Unix ms) */
  createdAt?: number;

  /** Last update timestamp (Unix ms) */
  updatedAt?: number;

  /** Thumbnail data URL (base64 PNG) */
  thumbnailDataUrl?: string;

  /** Thumbnail storage ID (future: Convex file storage) */
  thumbnailStorageId?: Id<'_storage'>;
}

/**
 * Page represents a logical page break in the resume
 * Computed at runtime from blocks + layout configuration
 */
export interface Page {
  /** Page number (1-indexed) */
  pageNumber: number;

  /** Index of first block on this page */
  startBlockIndex: number;

  /** Index of last block on this page */
  endBlockIndex: number;

  /** Blocks on this page */
  blocks: ResumeBlock[];

  /** Remaining height available on page (inches) */
  heightRemaining?: number;
}

/**
 * Helper type for blocks with computed height
 * Used in layout calculations
 */
export interface BlockWithHeight {
  block: ResumeBlock;
  height: number; // pixels
  index: number;
}

/**
 * Type guard to check if a block is of a specific type
 */
export function isBlockType<T extends ResumeBlock['type']>(
  block: ResumeBlock,
  type: T
): block is Extract<ResumeBlock, { type: T }> {
  return block.type === type;
}

/**
 * Safe getter for block data with type narrowing
 */
export function getBlockData<T extends ResumeBlock['type']>(
  block: ResumeBlock,
  type: T
): Extract<ResumeBlock, { type: T }>['data'] | null {
  if (isBlockType(block, type)) {
    return block.data;
  }
  return null;
}

/**
 * Sort blocks by order (ascending)
 */
export function sortBlocks(blocks: ResumeBlock[]): ResumeBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * Get the next available order number for a new block
 */
export function getNextBlockOrder(blocks: ResumeBlock[]): number {
  if (blocks.length === 0) return 0;
  const maxOrder = Math.max(...blocks.map(b => b.order));
  return maxOrder + 1;
}

/**
 * Resume Document Types
 *
 * Type definitions for resume documents, pages, and blocks.
 * Shared between the AI Resume Builder, profile-to-resume mapper, and studio editor.
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
  BlockFrame,
} from '../lib/resume-types';
import type { PageSize } from '../lib/resume-layout';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Page {
  id: string;
  size: PageSize;
  margins: PageMargins;
  /**
   * Ordered list of block IDs that belong to this page.
   * Block entities are stored separately to avoid duplication when cloning pages.
   *
   * IMPORTANT: This indirection creates potential for data inconsistencies:
   * - Block IDs may reference non-existent blocks
   * - Blocks may be orphaned (not referenced by any page)
   * - Block IDs could appear in multiple pages
   *
   * Use `validateResumeDocument()` from `@/lib/validate-resume-document` to
   * validate these relationships at runtime, especially:
   * - Before persisting to database
   * - After page/block operations (create, delete, duplicate)
   * - When loading data from external sources
   */
  blocks: string[];
}

/**
 * Discriminated union for type-safe resume blocks.
 * Ensures the `data` field matches the declared block type.
 */
export type ResumeBlock =
  | { type: 'header'; data: HeaderData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'summary'; data: SummaryData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'experience'; data: ExperienceData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'education'; data: EducationData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'skills'; data: SkillsData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'projects'; data: ProjectsData; order: number; locked?: boolean; frame?: BlockFrame }
  | { type: 'custom'; data: CustomData; order: number; locked?: boolean; frame?: BlockFrame };

/**
 * Resume document metadata as persisted in Convex.
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
  /** Optional page definitions (editor uses entity model) */
  pages?: Page[];
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
 * Type guard to check if a block is of a specific type.
 */
export function isBlockType<T extends ResumeBlock['type']>(
  block: ResumeBlock,
  type: T
): block is Extract<ResumeBlock, { type: T }> {
  return block.type === type;
}

/**
 * Safe getter for block data with type narrowing.
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
 * Sort blocks by order (ascending).
 */
export function sortBlocks(blocks: ResumeBlock[]): ResumeBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * Get the next available order number for a new block.
 */
export function getNextBlockOrder(blocks: ResumeBlock[]): number {
  if (blocks.length === 0) return 0;
  const maxOrder = Math.max(...blocks.map((b) => b.order));
  return maxOrder + 1;
}

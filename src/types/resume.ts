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
 * Base properties shared by all resume blocks.
 */
interface BaseBlockProperties {
  order: number;
  locked?: boolean;
  frame?: BlockFrame;
}

/**
 * Discriminated union for type-safe resume blocks.
 * Ensures the `data` field matches the declared block type.
 */
export type ResumeBlock =
  | ({ type: 'header'; data: HeaderData } & BaseBlockProperties)
  | ({ type: 'summary'; data: SummaryData } & BaseBlockProperties)
  | ({ type: 'experience'; data: ExperienceData } & BaseBlockProperties)
  | ({ type: 'education'; data: EducationData } & BaseBlockProperties)
  | ({ type: 'skills'; data: SkillsData } & BaseBlockProperties)
  | ({ type: 'projects'; data: ProjectsData } & BaseBlockProperties)
  | ({ type: 'custom'; data: CustomData } & BaseBlockProperties);

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
  /**
   * Optional page definitions (serialized as array for API/database).
   *
   * - Absent: Single-page resumes generated from profiles (AI builder, profile mapper)
   * - Present: Multi-page resumes created in the editor
   *
   * The editor internally uses a normalized entity model (Record<string, Page> and
   * Record<string, Block>) for efficient lookups and updates. This field stores the
   * serialized array representation for persistence.
   */
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
  if (!isBlockType(block, type)) {
    return null;
  }
  // Double assertion required due to TypeScript limitation:
  // After the type guard, block is correctly narrowed to Extract<ResumeBlock, { type: T }>,
  // but accessing block.data still yields a union of all data types (HeaderData | SummaryData | ...)
  // instead of the specific data type. TypeScript creates an intersection type for the return value
  // which conflicts with the union from block.data. The `as any` intermediate step bypasses this.
  //
  // Runtime safety: Guaranteed by isBlockType guard which validates block.type === type
  // Alternative: Use tRPC or zod for runtime type validation to eliminate assertions entirely
  return block.data as any as Extract<ResumeBlock, { type: T }>['data'];
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

/**
 * Phase 7 - Part A: Streaming Types
 * Type definitions for AI streaming suggestions
 */

import type { ResumeBlock } from '@/lib/validators/resume';

/**
 * Suggestion action types that AI can recommend
 */
export type SuggestionActionType =
  | 'rewrite_bullet'
  | 'add_metric'
  | 'strengthen_verb'
  | 'fix_tense'
  | 'expand_summary'
  | 'condense_text';

/**
 * Suggestion severity levels
 */
export type SuggestionSeverity = 'critical' | 'warning' | 'info';

/**
 * A single AI-generated suggestion for improving resume content
 */
export interface AISuggestion {
  /** Unique identifier for this suggestion */
  id: string;

  /** Type of action being suggested */
  actionType: SuggestionActionType;

  /** Severity/priority level */
  severity: SuggestionSeverity;

  /** Human-readable description of the suggestion */
  message: string;

  /** Detailed explanation (optional) */
  detail?: string;

  /** Target block ID this suggestion applies to */
  blockId: string;

  /** Target item index within the block (for experience bullets, skills, etc.) */
  itemIndex?: number;

  /** Target bullet index within the item (for experience/project bullets) */
  bulletIndex?: number;

  /** Proposed replacement content (if applicable) */
  proposedContent?: string;

  /** Confidence score 0-1 (optional) */
  confidence?: number;
}

/**
 * Streaming chunk types sent from server
 */
export type StreamChunkType = 'suggestion' | 'metadata' | 'error' | 'done';

/**
 * Base interface for all streaming chunks
 */
interface BaseStreamChunk {
  type: StreamChunkType;
  timestamp: number;
}

/**
 * Chunk containing a new suggestion
 */
export interface SuggestionChunk extends BaseStreamChunk {
  type: 'suggestion';
  data: AISuggestion;
}

/**
 * Chunk containing metadata about the streaming session
 */
export interface MetadataChunk extends BaseStreamChunk {
  type: 'metadata';
  data: {
    model: string;
    totalSuggestions?: number;
    analyzedBlocks?: number;
  };
}

/**
 * Chunk containing error information
 */
export interface ErrorChunk extends BaseStreamChunk {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

/**
 * Final chunk indicating stream completion
 */
export interface DoneChunk extends BaseStreamChunk {
  type: 'done';
  data: {
    totalSuggestions: number;
    durationMs: number;
  };
}

/**
 * Union type of all possible stream chunks
 */
export type StreamChunk = SuggestionChunk | MetadataChunk | ErrorChunk | DoneChunk;

/**
 * Request payload for streaming suggestions
 */
export interface StreamSuggestionsRequest {
  /** Resume ID to analyze */
  resumeId: string;

  /** Specific block IDs to analyze (optional, analyzes all if not provided) */
  blockIds?: string[];

  /** Context: target role for tailored suggestions */
  targetRole?: string;

  /** Context: target company for tailored suggestions */
  targetCompany?: string;
}

/**
 * Request payload for applying a suggestion
 */
export interface ApplySuggestionRequest {
  /** Resume ID to modify */
  resumeId: string;

  /** Suggestion to apply */
  suggestion: AISuggestion;

  /** User can optionally edit the proposed content before applying */
  editedContent?: string;

  /** Optional idempotency key supplied by client */
  idempotencyKey?: string;
}

/**
 * Response from apply suggestion endpoint
 *
 * Uses discriminated union to ensure type safety:
 * - Success responses MUST have updatedBlock
 * - Error responses MUST have error message
 * - Impossible states are prevented (e.g., success: true with error field)
 */
export type ApplySuggestionResponse =
  | {
      success: true;
      /** Updated block after applying suggestion */
      updatedBlock: ResumeBlock;
      /** History entry ID for undo support */
      historyEntryId?: string;
      /** Sanitization details when content required redaction */
      sanitized?: {
        redactions: number;
        patterns: Array<'ssn' | 'phone' | 'email'>;
      };
      /** Indicates response came from idempotency cache */
      idempotent?: boolean;
    }
  | {
      success: false;
      /** Error message explaining why suggestion could not be applied */
      error: string;
      /** Indicates response came from idempotency cache */
      idempotent?: boolean;
    };

/**
 * State of the streaming process
 */
export type StreamState = 'idle' | 'connecting' | 'streaming' | 'done' | 'error';

/**
 * Streaming session status
 */
export interface StreamStatus {
  state: StreamState;
  suggestions: AISuggestion[];
  error?: string;
  metadata?: {
    model: string;
    totalSuggestions?: number;
    analyzedBlocks?: number;
  };
}

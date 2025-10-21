export type BlockId = string;
export type PageId = string;

/**
 * Block type in the editor tree structure
 *
 * **Tree Structure Constraints:**
 * - Root blocks: `parentId` is a `PageId` or `null`
 * - Nested blocks: `parentId` is a `BlockId` (must reference existing block)
 * - Leaf blocks: No `children` array (e.g., "text", "heading", "image")
 * - Container blocks: Have `children` array (e.g., "section")
 *
 * **Hierarchy Rules:**
 * - MUST NOT create circular references (Block A → Block B → Block A)
 * - MUST NOT have infinite nesting depth (recommend max 3 levels)
 * - Container blocks SHOULD NOT be both parent and child (prefer flat structure)
 *
 * **Props Type Safety:**
 * - `props` uses `Record<string, unknown>` for flexibility across block types
 * - Actual runtime props depend on `type`:
 *   - `"text"`: `{ content: string; fontSize?: number; ... }`
 *   - `"heading"`: `{ level: 1-6; content: string; ... }`
 *   - `"section"`: `{ title?: string; collapsed?: boolean; ... }`
 *   - `"image"`: `{ src: string; alt?: string; width?: number; ... }`
 *   - `"shape"`: `{ shapeType: string; fill?: string; ... }`
 * - Consider using type guards for runtime validation:
 *   ```ts
 *   function isTextBlock(block: Block): block is Block & { props: TextProps } {
 *     return block.type === "text";
 *   }
 *   ```
 *
 * **Validation:**
 * - Use `validateBlockTree()` in development to detect structural issues
 * - Production code assumes valid tree structure for performance
 *
 * @see validateBlockTree - Runtime validation helper
 */
export type Block = {
  id: BlockId;
  type: "text" | "heading" | "section" | "image" | "shape";
  parentId: PageId | BlockId | null;
  props: Record<string, unknown>;
  children?: BlockId[];
};

/**
 * Page type representing a canvas page with layout and block ownership
 *
 * **Block Ownership Relationship:**
 * - `blockIds` lists the top-level blocks that belong to this page
 * - Each block in `blockIds` SHOULD have `parentId` equal to this page's `id`
 * - This relationship is NOT enforced by the type system - it's an implicit contract
 *
 * **Consistency Requirements:**
 * ```ts
 * // Valid state:
 * const page: Page = { id: 'page1', blockIds: ['block1', 'block2'], ... };
 * const block1: Block = { id: 'block1', parentId: 'page1', ... };
 * const block2: Block = { id: 'block2', parentId: 'page1', ... };
 *
 * // Invalid state (inconsistent parentId):
 * const page: Page = { id: 'page1', blockIds: ['block1'], ... };
 * const block1: Block = { id: 'block1', parentId: 'page2', ... }; // ❌ Wrong parent!
 *
 * // Invalid state (orphaned block):
 * const page: Page = { id: 'page1', blockIds: ['block1'], ... };
 * // block1 doesn't exist in blocks map ❌
 * ```
 *
 * **Validation:**
 * - Use `validateBlockTree()` with page data to detect inconsistencies
 * - Consider adding `validatePageBlockOwnership(page, blocks)` helper
 *
 * **Notes:**
 * - Nested blocks (children of blocks) should NOT appear in `blockIds`
 * - Only top-level blocks directly owned by the page should be listed
 * - Order in `blockIds` typically represents visual stacking order
 *
 * @see Block.parentId - Must match this page's ID for blocks in blockIds
 * @see validateBlockTree - Runtime validation helper
 */
export type Page = {
  id: PageId;
  size: { width: number; height: number };
  margins?: { top: number; right: number; bottom: number; left: number };
  blockIds: BlockId[];
};

export type Selection = { ids: BlockId[]; lastChangedAt: number };

/**
 * Data source interface for the canvas rendering layer
 *
 * **Immutability Contract:**
 * - All getters return shallow `Readonly<>` references
 * - Consumers MUST NOT mutate returned objects or nested properties
 * - The `Readonly<>` wrapper only prevents top-level reassignment:
 *   ```ts
 *   const blocks = dataSource.getBlocks();
 *   blocks["new-id"] = {...}; // ❌ Prevented by Readonly<>
 *
 *   const block = blocks["some-id"];
 *   block.props.name = "changed"; // ⚠️ NOT prevented (nested mutation)
 *   block.children?.push("new-id"); // ⚠️ NOT prevented (array mutation)
 *   ```
 * - To modify data, use the mutation methods or the underlying store's API
 *
 * **Mutation Surface:**
 * - `select()`: Only method that mutates state through this interface
 * - Block/page updates: Not exposed here - use EditorStore or MutationBroker
 * - This interface is intentionally read-only for rendering isolation
 *
 * **Change Notification:**
 * - `onChange()` fires on ANY data change (blocks, pages, selection, etc.)
 * - No change details provided - consumers must re-query needed data
 * - Designed for React components that re-render on any store change
 * - For granular updates, consider subscribing to specific store slices
 *
 * @see EditorStore - For full read/write access with undo/redo
 * @see MutationBroker - For coordinated mutations with Convex sync
 */
export type CanvasDataSource = {
  /**
   * Get all blocks in the editor
   * @returns Shallow readonly record of blocks (do not mutate nested properties)
   */
  getBlocks(): Readonly<Record<BlockId, Block>>;

  /**
   * Get a specific page by ID
   * @returns Shallow readonly page or undefined (do not mutate nested properties)
   */
  getPage(id: PageId): Readonly<Page> | undefined;

  /**
   * Get the ordered list of page IDs
   * @returns Shallow readonly array of page IDs (do not mutate)
   */
  getPageOrder(): Readonly<PageId[]>;

  /**
   * Get the current selection state
   * @returns Shallow readonly selection (do not mutate)
   */
  getSelection(): Readonly<Selection>;

  /**
   * Update the current selection (only mutation method in this interface)
   * @param ids - Block IDs to select
   */
  select(ids: BlockId[]): void;

  /**
   * Subscribe to any data changes
   * @param cb - Callback fired on any change (blocks, pages, selection, etc.)
   * @returns Unsubscribe function
   */
  onChange(cb: () => void): () => void;
};

/**
 * Validation result for block tree structure
 */
export interface BlockTreeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Runtime validation helper for block tree structure
 *
 * Detects common structural issues:
 * - Circular references in parent-child relationships
 * - Dangling block references (parentId or children pointing to non-existent blocks)
 * - Excessive nesting depth
 * - Invalid parent/child combinations
 *
 * **Usage:**
 * ```ts
 * const blocks = dataSource.getBlocks();
 * const result = validateBlockTree(blocks);
 * if (!result.valid) {
 *   console.error('Block tree validation failed:', result.errors);
 * }
 * ```
 *
 * @param blocks - Record of all blocks to validate
 * @param maxDepth - Maximum allowed nesting depth (default: 3)
 * @returns Validation result with errors and warnings
 */
export function validateBlockTree(
  blocks: Readonly<Record<BlockId, Block>>,
  maxDepth = 3
): BlockTreeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper: Check if a block exists
  const blockExists = (id: BlockId): boolean => id in blocks;

  // Helper: Detect circular references using DFS
  function detectCycles(blockId: BlockId, visited = new Set<BlockId>(), path = new Set<BlockId>()): boolean {
    if (path.has(blockId)) {
      errors.push(`Circular reference detected: ${Array.from(path).join(' → ')} → ${blockId}`);
      return true;
    }

    if (visited.has(blockId)) {
      return false; // Already validated this subtree
    }

    visited.add(blockId);
    path.add(blockId);

    const block = blocks[blockId];
    if (block?.children) {
      for (const childId of block.children) {
        if (detectCycles(childId, visited, path)) {
          return true;
        }
      }
    }

    path.delete(blockId);
    return false;
  }

  // Helper: Calculate depth of a block
  function getDepth(blockId: BlockId, visited = new Set<BlockId>()): number {
    if (visited.has(blockId)) {
      return 0; // Prevent infinite recursion
    }
    visited.add(blockId);

    const block = blocks[blockId];
    if (!block?.children || block.children.length === 0) {
      return 0;
    }

    const childDepths = block.children.map((childId) => getDepth(childId, visited));
    return 1 + Math.max(...childDepths);
  }

  // Validate each block
  for (const [blockId, block] of Object.entries(blocks)) {
    // Check for dangling parentId references
    if (block.parentId && typeof block.parentId === 'string') {
      // Assume PageIds are valid if they're not in blocks record
      if (blockExists(block.parentId as BlockId) && !blocks[block.parentId as BlockId]) {
        errors.push(`Block "${blockId}" has parentId "${block.parentId}" that doesn't exist`);
      }
    }

    // Check for dangling children references
    if (block.children) {
      for (const childId of block.children) {
        if (!blockExists(childId)) {
          errors.push(`Block "${blockId}" has child "${childId}" that doesn't exist`);
        }
      }
    }

    // Check for circular references
    if (block.children && block.children.length > 0) {
      detectCycles(blockId);
    }

    // Check nesting depth
    const depth = getDepth(blockId);
    if (depth > maxDepth) {
      warnings.push(`Block "${blockId}" has nesting depth ${depth}, exceeds recommended max of ${maxDepth}`);
    }

    // Check for blocks that are both parents and children
    if (block.children && block.children.length > 0 && block.parentId && typeof block.parentId === 'string' && blockExists(block.parentId as BlockId)) {
      warnings.push(`Block "${blockId}" is both a parent (has children) and a child (has BlockId parent) - consider flattening structure`);
    }

    // Type-specific validations
    if ((block.type === 'text' || block.type === 'heading' || block.type === 'image') && block.children) {
      warnings.push(`Block "${blockId}" of type "${block.type}" has children array - leaf blocks typically don't have children`);
    }

    if (block.type === 'section' && (!block.children || block.children.length === 0)) {
      warnings.push(`Block "${blockId}" of type "section" has no children - container blocks should have children`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

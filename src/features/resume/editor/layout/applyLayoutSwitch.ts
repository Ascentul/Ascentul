import type { EditorSnapshot, BlockId } from '../types/editorTypes';
import type { LayoutDefinition, TemplateBlockType } from '@/lib/templates';
import { migrateLayout } from './migrateLayout';

/**
 * Apply layout switch orchestrator (Phase 5 implementation)
 *
 * Coordinates the layout switch process:
 * 1. Collect current block IDs and types from all pages
 * 2. Call migration mapper to assign blocks to regions
 * 3. Apply migrated block order to the first page (main + overflow regions)
 * 4. Return new snapshot for single history push
 *
 * **Phase 5 limitations:**
 * - No multi-region support yet (all blocks on single page)
 * - No parentId updates (blocks remain in flat structure)
 * - Future phases will implement true multi-column layouts
 *
 * Note: Reflow is called separately by the store after applying this snapshot.
 *
 * @param currentSnapshot - Current editor state
 * @param targetLayout - Layout definition to switch to
 * @returns New editor snapshot with updated block order
 */
export function applyLayoutSwitch(
  currentSnapshot: EditorSnapshot,
  targetLayout: LayoutDefinition
): EditorSnapshot {
  // Collect block IDs in current order (respecting page order)
  const blockIds: BlockId[] = [];
  const blockTypes: Record<BlockId, TemplateBlockType> = {};

  // Iterate through pages in order to preserve block sequence
  for (const pageId of currentSnapshot.pageOrder) {
    const page = currentSnapshot.pagesById[pageId];
    if (!page) continue;

    for (const blockId of page.blockIds) {
      const block = currentSnapshot.blocksById[blockId];
      if (!block) continue;

      blockIds.push(blockId);
      blockTypes[blockId] = block.type as TemplateBlockType;
    }
  }

  // Execute migration
  const migrationResult = migrateLayout(targetLayout, { blockIds, blockTypes });

  // Phase 5: For single-column layout, all blocks go to main region
  // Overflow is empty unless migration specifically assigns blocks there
  const mainRegionBlocks = migrationResult.regionAssignments['main'] || [];
  const overflowBlocks = migrationResult.overflow || [];

  // Apply the migrated block order to pages
  // For Phase 5: Single-page layout with all blocks in order (main + overflow)
  // Future phases will create actual multi-region pages
  const migratedBlockOrder = [...mainRegionBlocks, ...overflowBlocks];

  const nextPagesById = { ...currentSnapshot.pagesById };

  // Apply block order to the first page (or create one if none exists)
  if (currentSnapshot.pageOrder.length > 0) {
    const firstPageId = currentSnapshot.pageOrder[0];
    const firstPage = nextPagesById[firstPageId];

    if (firstPage) {
      nextPagesById[firstPageId] = {
        ...firstPage,
        blockIds: migratedBlockOrder,
      };
    }
  }

  // Phase 5: No parentId updates needed since we're not implementing true regions yet
  // blocksById remains unchanged (future phases will update block metadata for multi-column layouts)

  return {
    ...currentSnapshot,
    pagesById: nextPagesById,
    isDirty: true,
    lastChangedAt: Date.now(),
  };
}

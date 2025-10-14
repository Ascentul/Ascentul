'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { HeaderBlock } from './blocks/HeaderBlock';
import { SummaryBlock } from './blocks/SummaryBlock';
import { ExperienceBlock } from './blocks/ExperienceBlock';
import { EducationBlock } from './blocks/EducationBlock';
import { SkillsBlock } from './blocks/SkillsBlock';
import { ProjectsBlock } from './blocks/ProjectsBlock';
import { CustomBlock } from './blocks/CustomBlock';
import type { ResumeBlock } from '@/lib/validators/resume';
import { useSuggestions } from '@/hooks/useSuggestions';

export type PageSize = 'Letter' | 'A4';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ResumeCanvasProps {
  blocks: ResumeBlock[];
  pageSize?: PageSize;
  margins?: Margins;
  selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string | null) => void;
  onBlockUpdate?: (blockId: string, data: any) => void;
  onReorder?: (newBlocks: ResumeBlock[]) => void;
  readOnly?: boolean;
  templateSlug?: string;
  themeId?: string;
  onPagesCalculated?: (totalPages: number) => void;
}

// Page dimensions in pixels at 96 DPI
const PAGE_DIMENSIONS = {
  Letter: { width: 816, height: 1056 }, // 8.5" x 11"
  A4: { width: 794, height: 1123 },     // 210mm x 297mm
};

const DEFAULT_MARGINS: Margins = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

export function ResumeCanvas({
  blocks,
  pageSize = 'Letter',
  margins = DEFAULT_MARGINS,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onReorder,
  readOnly = false,
  templateSlug,
  themeId,
  onPagesCalculated,
}: ResumeCanvasProps) {
  const [blockHeights, setBlockHeights] = useState<Map<string, number>>(new Map());
  const [pages, setPages] = useState<ResumeBlock[][]>([]);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Get suggestions for all blocks
  const { getSuggestionsForBlock } = useSuggestions(blocks);

  const dimensions = PAGE_DIMENSIONS[pageSize];
  const contentWidth = dimensions.width - margins.left - margins.right;
  const contentHeight = dimensions.height - margins.top - margins.bottom;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Measure block heights
  const measureBlockHeights = useCallback(() => {
    const newHeights = new Map<string, number>();

    blockRefs.current.forEach((element, id) => {
      if (element) {
        const height = element.getBoundingClientRect().height;
        newHeights.set(id, height);
      }
    });

    setBlockHeights(newHeights);
  }, []);

  // Paginate blocks based on heights
  useEffect(() => {
    if (blockHeights.size === 0) return;

    const paginatedPages: ResumeBlock[][] = [];
    let currentPage: ResumeBlock[] = [];
    let currentPageHeight = 0;

    blocks.forEach((block) => {
      const blockId = (block as any)._id || `block-${block.order}`;
      const blockHeight = blockHeights.get(blockId) || 0;

      // Check if adding this block would exceed page height
      if (currentPageHeight + blockHeight > contentHeight && currentPage.length > 0) {
        // Start new page
        paginatedPages.push(currentPage);
        currentPage = [block];
        currentPageHeight = blockHeight;
      } else {
        // Add to current page
        currentPage.push(block);
        currentPageHeight += blockHeight;
      }
    });

    // Add last page if not empty
    if (currentPage.length > 0) {
      paginatedPages.push(currentPage);
    }

    setPages(paginatedPages);

    // Notify parent of total pages
    if (onPagesCalculated) {
      onPagesCalculated(paginatedPages.length || 1);
    }
  }, [blocks, blockHeights, contentHeight, onPagesCalculated]);

  // Measure heights on mount and when blocks change
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      measureBlockHeights();
    }, 100);

    return () => clearTimeout(timer);
  }, [blocks, measureBlockHeights]);

  // Scroll to top when template or theme changes
  useEffect(() => {
    if (containerRef.current) {
      const scrollContainer = containerRef.current.closest('[data-scroll-container]')
        ?? containerRef.current.parentElement;
      if (scrollContainer && 'scrollTo' in scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, [templateSlug, themeId]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = blocks.findIndex((b) => {
      const blockId = (b as any)._id || `block-${b.order}`;
      return blockId === active.id;
    });

    const newIndex = blocks.findIndex((b) => {
      const blockId = (b as any)._id || `block-${b.order}`;
      return blockId === over.id;
    });

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex).map(
        (block, index) => ({
          ...block,
          order: index,
        })
      );

      onReorder?.(reorderedBlocks);
    }
  };

  // Render block based on type
  const renderBlock = (block: ResumeBlock, index: number) => {
    const blockId = (block as any)._id || `block-${block.order}`;
    const isSelected = selectedBlockId === blockId;

    const blockProps = {
      data: block.data,
      isSelected,
      readOnly,
      onDataChange: (newData: any) => onBlockUpdate?.(blockId, newData),
      onClick: () => onBlockSelect?.(blockId),
      suggestions: getSuggestionsForBlock(blockId),
      blockId: blockId,
    };

    let BlockComponent;
    switch (block.type) {
      case 'header':
        BlockComponent = HeaderBlock;
        break;
      case 'summary':
        BlockComponent = SummaryBlock;
        break;
      case 'experience':
        BlockComponent = ExperienceBlock;
        break;
      case 'education':
        BlockComponent = EducationBlock;
        break;
      case 'skills':
        BlockComponent = SkillsBlock;
        break;
      case 'projects':
        BlockComponent = ProjectsBlock;
        break;
      case 'custom':
        BlockComponent = CustomBlock;
        break;
      default:
        return null;
    }

    return (
      <div
        key={blockId}
        ref={(el) => {
          if (el) {
            blockRefs.current.set(blockId, el);
          } else {
            blockRefs.current.delete(blockId);
          }
        }}
      >
        <BlockComponent {...blockProps} />
      </div>
    );
  };

  // Get sortable IDs
  const sortableIds = blocks.map((b) => {
    const blockId = (b as any)._id || `block-${b.order}`;
    return blockId;
  });

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-8 pb-16">
      {readOnly || pages.length === 0 ? (
        // Single page view for editing or empty state
        <div
          className="relative mx-auto my-8 shadow-xl bg-white"
          style={{
            width: `${dimensions.width}px`,
            minHeight: `${dimensions.height}px`,
            padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {blocks.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    No blocks yet. Add a block to get started.
                  </div>
                ) : (
                  blocks.map((block, index) => {
                    const blockId = (block as any)._id || `block-${block.order}`;

                    if (readOnly) {
                      return renderBlock(block, index);
                    }

                    return (
                      <SortableBlock key={blockId} id={blockId}>
                        {renderBlock(block, index)}
                      </SortableBlock>
                    );
                  })
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        // Multi-page view with pagination
        pages.map((pageBlocks, pageIndex) => (
          <div key={pageIndex} className="relative mx-auto my-8">
            {/* Page number */}
            <div className="absolute -top-6 left-0 text-sm text-gray-500">
              Page {pageIndex + 1} of {pages.length}
            </div>

            <div
              className="bg-white shadow-xl"
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
              }}
            >
              <div className="space-y-6">
                {pageBlocks.map((block, index) => renderBlock(block, index))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

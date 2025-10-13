'use client';

import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import type { Id } from '../../../../convex/_generated/dataModel';
import { BlockHeader } from '../blocks/BlockHeader';
import { BlockSummary } from '../blocks/BlockSummary';
import { BlockSkills } from '../blocks/BlockSkills';
import { BlockExperience } from '../blocks/BlockExperience';
import { BlockEducation } from '../blocks/BlockEducation';
import { BlockProjects } from '../blocks/BlockProjects';
import { BlockCustom } from '../blocks/BlockCustom';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockHeights } from '@/hooks/use-block-heights';
import {
  PAGE_CONFIGS,
  calculatePageBreaks,
  getCompactModeStyles,
  type LayoutConfig,
  type PageSize,
} from '@/lib/resume-layout';

interface ResumeCanvasProps {
  blocks: any[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onBlockUpdate: (blockId: string, updates: any) => void;
  onBlocksReorder: (newBlocks: any[]) => void;
  template: string;
  isCompact?: boolean;
  pageSize?: PageSize;
  baseline?: 4 | 6;
}

export function ResumeCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onBlockUpdate,
  onBlocksReorder,
  template,
  isCompact = false,
  pageSize = 'Letter',
  baseline = 4,
}: ResumeCanvasProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [currentPageView, setCurrentPageView] = useState(1);

  // Get block heights and calculate page breaks
  const { blocksWithHeights, isReflowing, registerBlock, remeasure } = useBlockHeights(blocks);

  // Layout configuration
  const layoutConfig: LayoutConfig = {
    ...PAGE_CONFIGS[pageSize],
    baseline,
    isCompact,
  };

  // Calculate page breaks
  const pageBreaks = calculatePageBreaks(blocksWithHeights, layoutConfig);
  const totalPages = pageBreaks.length || 1;

  // Remeasure when blocks reorder or compact mode changes
  useEffect(() => {
    remeasure();
  }, [blocks.length, isCompact, remeasure]);

  const handleReorder = (newBlocks: any[]) => {
    onBlocksReorder(newBlocks);
    // Remeasure after reorder
    setTimeout(() => remeasure(), 100);
  };

  const renderBlock = (block: any, isSelected: boolean, ref: (el: HTMLDivElement | null) => void) => {
    const commonProps = {
      data: block.data,
      isSelected,
      isEditable: true,
      onChange: (data: any) => onBlockUpdate(block._id, { data }),
    };

    let blockContent;
    switch (block.type) {
      case 'header':
        blockContent = <BlockHeader {...commonProps} />;
        break;
      case 'summary':
        blockContent = <BlockSummary {...commonProps} />;
        break;
      case 'skills':
        blockContent = <BlockSkills {...commonProps} />;
        break;
      case 'experience':
        blockContent = <BlockExperience {...commonProps} />;
        break;
      case 'education':
        blockContent = <BlockEducation {...commonProps} />;
        break;
      case 'projects':
        blockContent = <BlockProjects {...commonProps} />;
        break;
      case 'custom':
        blockContent = <BlockCustom {...commonProps} />;
        break;
      default:
        blockContent = <div className="p-4 text-muted-foreground">Unknown block type</div>;
    }

    return (
      <div ref={ref} data-block-id={block._id}>
        {blockContent}
      </div>
    );
  };

  return (
    <div className="max-w-[8.5in] mx-auto">
      {/* Page Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPageView} of {totalPages}
          {isReflowing && <span className="ml-2 text-xs">(calculating...)</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
          >
            {showGrid ? 'Hide' : 'Show'} Grid
          </button>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPageView((p) => Math.max(1, p - 1))}
            disabled={currentPageView === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPageView((p) => Math.min(totalPages, p + 1))}
            disabled={currentPageView === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="space-y-8">
        {pageBreaks.map((page) => {
          const isCurrentPage = page.pageNumber === currentPageView;
          const shouldRender = Math.abs(page.pageNumber - currentPageView) <= 1; // Render current and adjacent pages

          if (!shouldRender) return null;

          return (
            <motion.div
              key={page.pageNumber}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isCurrentPage ? 1 : 0.3, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white shadow-xl rounded-sm overflow-hidden relative transition-opacity ${
                showGrid ? 'grid-overlay' : ''
              } ${!isCurrentPage ? 'pointer-events-none' : ''}`}
              style={{
                width: `${layoutConfig.pageWidth}in`,
                minHeight: `${layoutConfig.pageHeight}in`,
                padding: `${layoutConfig.margins.top}in ${layoutConfig.margins.right}in ${layoutConfig.margins.bottom}in ${layoutConfig.margins.left}in`,
                ...getCompactModeStyles(isCompact),
              }}
            >
              {/* Page Number Indicator */}
              <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {page.pageNumber}
              </div>

              {/* Grid Overlay */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: `${baseline / 96}in ${baseline / 96}in`,
                  }}
                />
              )}

              {/* Blocks for this page */}
              {page.pageNumber === 1 ? (
                // First page uses Reorder for drag-and-drop
                <Reorder.Group
                  axis="y"
                  values={blocks}
                  onReorder={handleReorder}
                  className={`relative z-10 ${isCompact ? 'compact-mode' : ''}`}
                  style={{
                    gap: isCompact ? '0.5rem' : '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {page.blocks.map((item) => {
                    const block = item.block;
                    const isSelected = block._id === selectedBlockId;
                    const isLocked = block.locked;

                    return (
                      <Reorder.Item
                        key={block._id}
                        value={block}
                        dragListener={!isLocked}
                        className={`group relative transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary rounded'
                            : 'hover:ring-1 hover:ring-muted-foreground/20 rounded'
                        }`}
                        onClick={() => onSelectBlock(block._id)}
                      >
                        {/* Drag Handle */}
                        {!isLocked && (
                          <div className="absolute -left-8 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          </div>
                        )}

                        {/* Block Content */}
                        <div className={isLocked ? 'opacity-60' : ''}>
                          {renderBlock(block, isSelected, (el) => el && registerBlock(block._id, el))}
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="selectedBlock"
                            className="absolute inset-0 rounded border-2 border-primary pointer-events-none"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              ) : (
                // Subsequent pages are static (no drag-and-drop)
                <div
                  className={`relative z-10 ${isCompact ? 'compact-mode' : ''}`}
                  style={{
                    gap: isCompact ? '0.5rem' : '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {page.blocks.map((item) => {
                    const block = item.block;
                    const isSelected = block._id === selectedBlockId;

                    return (
                      <div
                        key={block._id}
                        className={`transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary rounded'
                            : 'hover:ring-1 hover:ring-muted-foreground/20 rounded'
                        }`}
                        onClick={() => onSelectBlock(block._id)}
                      >
                        {renderBlock(block, isSelected, (el) => el && registerBlock(block._id, el))}

                        {isSelected && (
                          <motion.div
                            layoutId="selectedBlock"
                            className="absolute inset-0 rounded border-2 border-primary pointer-events-none"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Page Break Indicator */}
              {page.pageNumber < totalPages && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Page break
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div
          className="bg-white shadow-xl rounded-sm flex items-center justify-center text-muted-foreground"
          style={{
            width: `${layoutConfig.pageWidth}in`,
            minHeight: `${layoutConfig.pageHeight}in`,
          }}
        >
          <div className="text-center">
            <p className="text-lg font-medium">No blocks yet</p>
            <p className="text-sm">Use the toolbar to generate or add blocks</p>
          </div>
        </div>
      )}

      {/* Compact Mode Styles */}
      <style jsx global>{`
        .compact-mode {
          --spacing-y: 0.5rem;
        }

        .compact-mode h1,
        .compact-mode h2,
        .compact-mode h3,
        .compact-mode h4 {
          line-height: 1.2 !important;
          margin-bottom: 0.25rem !important;
        }

        .compact-mode p,
        .compact-mode li,
        .compact-mode div {
          line-height: 1.4 !important;
        }

        .compact-mode ul,
        .compact-mode ol {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }

        .compact-mode li {
          margin-bottom: 0.125rem !important;
        }

        .compact-mode .space-y-1 > * + * {
          margin-top: 0.125rem !important;
        }

        .compact-mode .space-y-2 > * + * {
          margin-top: 0.25rem !important;
        }

        .compact-mode .space-y-3 > * + * {
          margin-top: 0.375rem !important;
        }

        .compact-mode .space-y-4 > * + * {
          margin-top: 0.5rem !important;
        }
      `}</style>
    </div>
  );
}

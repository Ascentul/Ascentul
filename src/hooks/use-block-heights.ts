/**
 * Hook for measuring block heights and calculating page breaks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BlockWithHeight } from '@/lib/resume-layout';

export function useBlockHeights(blocks: any[]) {
  const [blocksWithHeights, setBlocksWithHeights] = useState<BlockWithHeight[]>([]);
  const [isReflowing, setIsReflowing] = useState(false);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const measurementTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Register a block element for height measurement
   */
  const registerBlock = useCallback((blockId: string, element: HTMLElement | null) => {
    if (element) {
      blockRefs.current.set(blockId, element);
    } else {
      blockRefs.current.delete(blockId);
    }
  }, []);

  /**
   * Measure all block heights
   */
  const measureHeights = useCallback(() => {
    setIsReflowing(true);

    const measured: BlockWithHeight[] = blocks.map((block, index) => {
      const element = blockRefs.current.get(block._id);
      const height = element ? element.getBoundingClientRect().height : 0;

      return {
        block,
        height,
        index,
      };
    });

    setBlocksWithHeights(measured);
    setIsReflowing(false);
  }, [blocks]);

  /**
   * Debounced height measurement
   */
  const debouncedMeasure = useCallback(() => {
    if (measurementTimeoutRef.current) {
      clearTimeout(measurementTimeoutRef.current);
    }

    measurementTimeoutRef.current = setTimeout(() => {
      measureHeights();
    }, 100);
  }, [measureHeights]);

  /**
   * Trigger measurement when blocks change
   */
  useEffect(() => {
    // Wait for DOM to update
    requestAnimationFrame(() => {
      debouncedMeasure();
    });

    return () => {
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
      }
    };
  }, [blocks, debouncedMeasure]);

  /**
   * Force remeasure (useful after drag/drop or content changes)
   */
  const remeasure = useCallback(() => {
    measureHeights();
  }, [measureHeights]);

  return {
    blocksWithHeights,
    isReflowing,
    registerBlock,
    remeasure,
  };
}

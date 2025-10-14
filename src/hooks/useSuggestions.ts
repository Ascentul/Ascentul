import { useMemo } from 'react';
import { analyzeResume, type ContentSuggestion } from '@/lib/ai/suggestions';
import type { Block } from '@/lib/resume-types';

/**
 * Hook to analyze resume blocks and provide improvement suggestions
 */
export function useSuggestions(blocks: Block[]) {
  const suggestionsByBlock = useMemo(() => {
    if (!blocks || blocks.length === 0) {
      return new Map<string, ContentSuggestion[]>();
    }

    return analyzeResume(blocks);
  }, [blocks]);

  const totalSuggestions = useMemo(() => {
    let total = 0;
    suggestionsByBlock.forEach((suggestions) => {
      total += suggestions.length;
    });
    return total;
  }, [suggestionsByBlock]);

  const highPrioritySuggestions = useMemo(() => {
    let count = 0;
    suggestionsByBlock.forEach((suggestions) => {
      count += suggestions.filter(s => s.priority === 'high').length;
    });
    return count;
  }, [suggestionsByBlock]);

  const getSuggestionsForBlock = (blockId: string): ContentSuggestion[] => {
    return suggestionsByBlock.get(blockId) || [];
  };

  return {
    suggestionsByBlock,
    totalSuggestions,
    highPrioritySuggestions,
    getSuggestionsForBlock,
  };
}

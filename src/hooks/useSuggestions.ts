import { useMemo, useCallback } from 'react';
import { analyzeResume, type ContentSuggestion } from '@/lib/ai/suggestions';
import type { ResumeBlock } from '@/lib/validators/resume';

/**
 * Hook to analyze resume blocks and provide improvement suggestions
 */
export function useSuggestions(blocks: ResumeBlock[]) {
  const suggestionsByBlock = useMemo(() => {
    if (!blocks || blocks.length === 0) {
      return new Map<string, ContentSuggestion[]>();
    }

    return analyzeResume(blocks);
  }, [blocks]);

  const { totalSuggestions, highPrioritySuggestions } = useMemo(() => {
    let total = 0;
    let highPriority = 0;
    suggestionsByBlock.forEach((suggestions) => {
      total += suggestions.length;
      highPriority += suggestions.filter(s => s.priority === 'high').length;
    });
    return { totalSuggestions: total, highPrioritySuggestions: highPriority };
  }, [suggestionsByBlock]);

  const getSuggestionsForBlock = useCallback(
    (blockId: string): ContentSuggestion[] => {
      return suggestionsByBlock.get(blockId) || [];
    },
    [suggestionsByBlock]
  );

  return {
    suggestionsByBlock,
    totalSuggestions,
    highPrioritySuggestions,
    getSuggestionsForBlock,
  };
}

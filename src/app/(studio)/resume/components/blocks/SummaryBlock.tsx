import type { SummaryData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface SummaryBlockProps {
  data: SummaryData;
  isSelected?: boolean;
  onClick?: () => void;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function SummaryBlock({ data, isSelected, onClick, suggestions, blockId }: SummaryBlockProps) {
  const { paragraph } = data;

  if (!paragraph) return null;

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      onClick={onClick}
      aria-label="Professional summary"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Summary
      </h2>
      <p className="text-sm text-neutral-700 leading-relaxed">
        {paragraph}
      </p>

      {/* Show suggestions when block is selected */}
      {isSelected && blockId && suggestions && suggestions.length > 0 && (
        <BlockSuggestions
          blockId={blockId}
          suggestions={suggestions}
        />
      )}
    </section>
  );
}

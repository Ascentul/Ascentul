import type { CustomData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface CustomBlockProps {
  data: CustomData;
  isSelected?: boolean;
  onClick?: () => void;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function CustomBlock({ data, isSelected, onClick, suggestions, blockId }: CustomBlockProps) {
  const { heading, content, bullets } = data;

  if (!heading) return null;

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      onClick={onClick}
      aria-label={`Custom section: ${heading}`}
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        {heading}
      </h2>

      {content && (
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="space-y-0.5">
          {bullets.map((item, idx) => {
            // Use first 50 chars of bullet + index for stable key
            // Handles duplicate bullets while maintaining stability
            const bulletKey = `${item.slice(0, 50)}-${idx}`;
            return (
              <li
                key={bulletKey}
                className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
              >
                {item}
              </li>
            );
          })}
        </ul>
      )}

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

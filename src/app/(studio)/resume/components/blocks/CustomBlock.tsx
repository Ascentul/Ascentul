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
  const bulletOccurrences = new Map<string, number>();

  if (!heading) return null;

  return (
    <section
      className="space-y-2 transition-all"
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
          {bullets.map((item) => {
            const count = bulletOccurrences.get(item) ?? 0;
            bulletOccurrences.set(item, count + 1);
            const key = count === 0 ? item : `${item}-${count}`;

            return (
              <li
                key={key}
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

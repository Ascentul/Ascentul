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
  const { heading, bullets } = data;

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

      {bullets && bullets.length > 0 && (
        <ul className="space-y-0.5">
          {bullets.map((item, idx) => (
            <li
              key={`${item.substring(0, 30)}-${idx}`}
              className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Show suggestions when block is selected */}
      {isSelected && suggestions?.length && blockId && (
        <BlockSuggestions
          blockId={blockId}
          suggestions={suggestions}
        />
      )}
    </section>
  );
}

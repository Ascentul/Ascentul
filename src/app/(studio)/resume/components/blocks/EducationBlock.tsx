import type { EducationData, EducationItem } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface EducationBlockProps {
  data: EducationData;
  isSelected?: boolean;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

const MAX_DETAILS = 6;

export function EducationBlock({
  data,
  isSelected,
  suggestions,
  blockId,
}: EducationBlockProps) {
  const items = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) return null;

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      role="region"
      aria-label="Education"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Education
      </h2>

      <div className="space-y-6">
        {items.map((item: EducationItem, idx) => {
          const school = item?.school?.trim() ?? '';
          const degree = item?.degree?.trim() ?? '';
          const end = item?.end?.trim() ?? '';
          const details = Array.isArray(item?.details)
            ? item.details.filter(Boolean).slice(0, MAX_DETAILS)
            : [];

          return (
            <article key={idx} className="space-y-1">
              {(school || end) && (
                <div className="flex items-baseline justify-between gap-2">
                  {school && (
                    <p className="text-base font-medium text-neutral-900">
                      {school}
                    </p>
                  )}
                  {end && (
                    <time className="text-sm text-neutral-600 whitespace-nowrap">
                      {end}
                    </time>
                  )}
                </div>
              )}

              {degree && (
                <p className="text-sm text-neutral-600 font-medium">
                  {degree}
                </p>
              )}

              {details.length > 0 && (
                <ul className="space-y-0.5 mt-2" role="list">
                  {details.map((detail, detailIdx) => (
                    <li
                      key={detailIdx}
                      className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
                    >
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {isSelected && suggestions && suggestions.length > 0 && blockId && (
        <BlockSuggestions blockId={blockId} suggestions={suggestions} />
      )}
    </section>
  );
}

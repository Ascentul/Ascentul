import type { ExperienceData, ExperienceItem } from '@/lib/resume/types';
import { fmtDates } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface ExperienceBlockProps {
  data: ExperienceData;
  isSelected?: boolean;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

const MAX_BULLETS = 6;

export function ExperienceBlock({
  data,
  isSelected,
  suggestions,
  blockId,
}: ExperienceBlockProps) {
  const items = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) return null;

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      role="region"
      aria-label="Work experience"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Experience
      </h2>

      <div className="space-y-6">
        {items.map((item: ExperienceItem, idx) => {
          const role = item?.role?.trim() ?? '';
          const company = item?.company?.trim() ?? '';
          const heading =
            role && company ? `${role} at ${company}` : role || company;

          const location = item?.location?.trim() ?? '';
          const dateRange = fmtDates(item?.start, item?.end);
          const meta = [location, dateRange].filter(Boolean).join(' • ');

          const bullets = Array.isArray(item?.bullets)
            ? item.bullets.filter(Boolean).slice(0, MAX_BULLETS)
            : [];

          return (
            <article key={idx} className="space-y-1">
              {heading && (
                <p className="text-base font-medium text-neutral-900">
                  {heading}
                </p>
              )}

              {meta && (
                <p className="text-sm text-neutral-600">
                  {meta}
                </p>
              )}

              {bullets.length > 0 && (
                <ul className="space-y-0.5 mt-2" role="list">
                  {bullets.map((bullet, bulletIdx) => (
                    <li
                      key={bulletIdx}
                      className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
                    >
                      {bullet}
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

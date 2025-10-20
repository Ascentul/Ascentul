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
  const experienceKeyOccurrences = new Map<string, number>();

  if (items.length === 0) return null;

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      aria-label="Work experience"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Experience
      </h2>

      <div className="space-y-6">
        {items.map((item: ExperienceItem) => {
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

          // Generate stable key: prefer id-based values, fallback to content-derived key
          const itemWithId = item as ExperienceItem & { id?: string; _id?: string };
          const baseFallback =
            [role, company, item?.start ?? '', item?.end ?? '', location]
              .map((segment) => (segment || '').toString().trim())
              .filter(Boolean)
              .join('|') || 'experience-item';
          const occurrence = experienceKeyOccurrences.get(baseFallback) ?? 0;
          experienceKeyOccurrences.set(baseFallback, occurrence + 1);
          const fallbackKey = occurrence === 0 ? baseFallback : `${baseFallback}-${occurrence}`;
          const key = itemWithId.id ?? itemWithId._id ?? fallbackKey;

          return (
            <article key={key} className="space-y-1">
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
                <ul role="list" className="space-y-0.5 mt-2">
                  {bullets.map((bullet, bulletIdx) => {
                    // Use first 50 chars of bullet + index for stable key
                    // Handles duplicate bullets while maintaining stability
                    const bulletKey = `${bullet.slice(0, 50)}-${bulletIdx}`;
                    return (
                      <li
                        key={bulletKey}
                        className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
                      >
                        {bullet}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {isSelected && blockId && suggestions && suggestions.length > 0 && (
        <BlockSuggestions blockId={blockId} suggestions={suggestions} />
      )}
    </section>
  );
}

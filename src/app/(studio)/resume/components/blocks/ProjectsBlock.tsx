import type { ProjectsData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface ProjectsBlockProps {
  data: ProjectsData;
  isSelected?: boolean;
  onClick?: () => void;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function ProjectsBlock({ data, isSelected, onClick, suggestions, blockId }: ProjectsBlockProps) {
  const { items } = data;

  if (!items || items.length === 0) {
    return (
      <section className="space-y-2" role="region" aria-label="Projects">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
          Projects
        </h2>
        <p className="text-sm text-neutral-500">No projects to display</p>
      </section>
    );
  }

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      onClick={onClick}
      role="region"
      aria-label="Projects"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Projects
      </h2>

      <div className="space-y-6">
        {items.map((item, idx) => (
          <article key={item.name || idx} className="space-y-1">
            {/* Project Name */}
            <h3 className="text-base font-medium text-neutral-900">
              {item.name}
            </h3>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-neutral-700 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Bullets */}
            {item.bullets && item.bullets.length > 0 && (
              <ul className="space-y-0.5 mt-2">
                {item.bullets.map((bullet, i) => (
                  <li
                    key={bullet || i}
                    className="text-sm text-neutral-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

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

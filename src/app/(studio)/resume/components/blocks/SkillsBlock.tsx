import type { SkillsData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface SkillsBlockProps {
  data: SkillsData;
  isSelected?: boolean;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function SkillsBlock({ data, isSelected, suggestions, blockId }: SkillsBlockProps) {
  const primarySkills = Array.isArray(data.primary) ? data.primary : [];
  const secondarySkills = Array.isArray(data.secondary) ? data.secondary : [];

  if (primarySkills.length === 0 && secondarySkills.length === 0) return null;

  const renderSkillGroup = (skills: string[], keyPrefix: string) => (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={`${keyPrefix}-${skill}`}
          className="inline-block px-3 py-1 text-sm text-neutral-700 bg-neutral-100 rounded-full border border-neutral-200"
        >
          {skill}
        </span>
      ))}
    </div>
  );

  return (
    <section
      className={`space-y-2 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md p-2' : ''
      }`}
      aria-label="Skills"
    >
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Skills
      </h2>

      <div className="space-y-3">
        {primarySkills.length > 0 && renderSkillGroup(primarySkills, 'primary')}
        {secondarySkills.length > 0 && renderSkillGroup(secondarySkills, 'secondary')}
      </div>

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

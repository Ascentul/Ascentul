'use client';

import { Plus, X } from 'lucide-react';
import type { SkillsBlockData } from '@/lib/validators/resume';

interface SkillsBlockProps {
  data: SkillsBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: SkillsBlockData) => void;
  onClick?: () => void;
}

export function SkillsBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: SkillsBlockProps) {
  const handleSkillChange = (
    category: 'primary' | 'secondary',
    index: number,
    value: string
  ) => {
    if (readOnly) return;

    const newSkills = { ...data };
    const skills = [...(newSkills[category] || [])];
    skills[index] = value;
    newSkills[category] = skills;
    onDataChange?.(newSkills);
  };

  const addSkill = (category: 'primary' | 'secondary') => {
    const newSkills = { ...data };
    const skills = newSkills[category] || [];
    newSkills[category] = [...skills, ''];
    onDataChange?.(newSkills);
  };

  const removeSkill = (category: 'primary' | 'secondary', index: number) => {
    const newSkills = { ...data };
    const skills = newSkills[category] || [];
    newSkills[category] = skills.filter((_, i) => i !== index);
    onDataChange?.(newSkills);
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Skills
      </h2>

      <div className="space-y-4">
        {/* Primary Skills */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Core Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.primary.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm group"
              >
                {readOnly ? (
                  <span>{skill}</span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange('primary', index, e.target.value)}
                      className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-1 w-auto min-w-[60px]"
                      placeholder="Skill"
                      style={{ width: `${Math.max(60, skill.length * 8)}px` }}
                    />
                    <button
                      onClick={() => removeSkill('primary', index)}
                      className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}

            {!readOnly && (
              <button
                onClick={() => addSkill('primary')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border-2 border-dashed border-blue-300 rounded-full"
              >
                <Plus className="w-4 h-4" />
                Add skill
              </button>
            )}
          </div>
        </div>

        {/* Secondary Skills */}
        {((data.secondary && data.secondary.length > 0) || !readOnly) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Additional Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.secondary?.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm group"
                >
                  {readOnly ? (
                    <span>{skill}</span>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) =>
                          handleSkillChange('secondary', index, e.target.value)
                        }
                        className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-1 w-auto min-w-[60px]"
                        placeholder="Skill"
                        style={{ width: `${Math.max(60, skill.length * 8)}px` }}
                      />
                      <button
                        onClick={() => removeSkill('secondary', index)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {!readOnly && (
                <button
                  onClick={() => addSkill('secondary')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 px-3 py-1 border-2 border-dashed border-gray-300 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Add skill
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

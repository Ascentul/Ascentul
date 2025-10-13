'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface BlockSkillsProps {
  data: {
    categories?: Array<{
      name: string;
      skills: string[];
    }>;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockSkills({ data, isSelected, isEditable, onChange }: BlockSkillsProps) {
  const categories = data.categories || [];

  const handleAddCategory = () => {
    onChange({
      categories: [...categories, { name: 'New Category', skills: [] }],
    });
  };

  const handleUpdateCategory = (index: number, field: string, value: any) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    onChange({ categories: newCategories });
  };

  const handleAddSkill = (categoryIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].skills.push('New Skill');
    onChange({ categories: newCategories });
  };

  const handleRemoveSkill = (categoryIndex: number, skillIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].skills = newCategories[categoryIndex].skills.filter(
      (_, i) => i !== skillIndex
    );
    onChange({ categories: newCategories });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">SKILLS</h2>
      {categories.map((category, catIndex) => (
        <div key={catIndex} className="space-y-1">
          {isEditable ? (
            <>
              <Input
                value={category.name}
                onChange={(e) => handleUpdateCategory(catIndex, 'name', e.target.value)}
                className="font-semibold text-sm border-none focus-visible:ring-0 px-0"
              />
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <Input
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...category.skills];
                        newSkills[skillIndex] = e.target.value;
                        handleUpdateCategory(catIndex, 'skills', newSkills);
                      }}
                      className="h-auto p-0 text-xs border-none focus-visible:ring-0 bg-transparent w-20"
                    />
                    <button
                      onClick={() => handleRemoveSkill(catIndex, skillIndex)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddSkill(catIndex)}
                  className="h-6 text-xs"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm">{category.name}:</p>
              <p className="text-sm">{category.skills.join(', ')}</p>
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <Button size="sm" variant="outline" onClick={handleAddCategory} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Category
        </Button>
      )}
    </div>
  );
}

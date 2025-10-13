'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface BlockExperienceProps {
  data: {
    items?: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate: string;
      location?: string;
      achievements: string[];
    }>;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockExperience({ data, isSelected, isEditable, onChange }: BlockExperienceProps) {
  const items = data.items || [];

  const handleAddItem = () => {
    onChange({
      items: [
        ...items,
        {
          title: 'Job Title',
          company: 'Company Name',
          startDate: 'MM/YYYY',
          endDate: 'Present',
          location: '',
          achievements: ['Key achievement or responsibility'],
        },
      ],
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ items: newItems });
  };

  const handleAddAchievement = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].achievements.push('New achievement');
    onChange({ items: newItems });
  };

  const handleRemoveAchievement = (itemIndex: number, achIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].achievements = newItems[itemIndex].achievements.filter(
      (_, i) => i !== achIndex
    );
    onChange({ items: newItems });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">EXPERIENCE</h2>
      {items.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditable ? (
                <>
                  <Input
                    value={item.title}
                    onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                    className="font-bold text-base border-none focus-visible:ring-0 px-0"
                  />
                  <Input
                    value={item.company}
                    onChange={(e) => handleUpdateItem(index, 'company', e.target.value)}
                    className="text-sm border-none focus-visible:ring-0 px-0"
                  />
                </>
              ) : (
                <>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-sm">{item.company}</p>
                </>
              )}
            </div>
            <div className="text-right text-sm">
              {isEditable ? (
                <>
                  <Input
                    value={`${item.startDate} - ${item.endDate}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split(' - ');
                      handleUpdateItem(index, 'startDate', start || item.startDate);
                      handleUpdateItem(index, 'endDate', end || item.endDate);
                    }}
                    className="text-right text-sm border-none focus-visible:ring-0 px-0"
                  />
                  {item.location && (
                    <Input
                      value={item.location}
                      onChange={(e) => handleUpdateItem(index, 'location', e.target.value)}
                      className="text-right text-sm border-none focus-visible:ring-0 px-0"
                    />
                  )}
                </>
              ) : (
                <>
                  <p>
                    {item.startDate} - {item.endDate}
                  </p>
                  {item.location && <p>{item.location}</p>}
                </>
              )}
            </div>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {item.achievements.map((achievement, achIndex) => (
              <li key={achIndex} className="flex items-start gap-2">
                {isEditable ? (
                  <>
                    <span className="mt-1">•</span>
                    <Textarea
                      value={achievement}
                      onChange={(e) => {
                        const newAchievements = [...item.achievements];
                        newAchievements[achIndex] = e.target.value;
                        handleUpdateItem(index, 'achievements', newAchievements);
                      }}
                      className="flex-1 min-h-[40px] resize-none border-none focus-visible:ring-0 px-0"
                    />
                    <button
                      onClick={() => handleRemoveAchievement(index, achIndex)}
                      className="text-muted-foreground hover:text-foreground mt-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  achievement
                )}
              </li>
            ))}
          </ul>
          {isEditable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAddAchievement(index)}
              className="text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Achievement
            </Button>
          )}
        </div>
      ))}
      {isEditable && (
        <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Experience
        </Button>
      )}
    </div>
  );
}

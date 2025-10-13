'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BlockEducationProps {
  data: {
    items?: Array<{
      degree: string;
      school: string;
      graduationYear: string;
      gpa?: string;
      honors?: string;
    }>;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockEducation({ data, isSelected, isEditable, onChange }: BlockEducationProps) {
  const items = data.items || [];

  const handleAddItem = () => {
    onChange({
      items: [
        ...items,
        {
          degree: 'Bachelor of Science',
          school: 'University Name',
          graduationYear: 'YYYY',
          gpa: '',
          honors: '',
        },
      ],
    });
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">EDUCATION</h2>
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditable ? (
                <>
                  <Input
                    value={item.degree}
                    onChange={(e) => handleUpdateItem(index, 'degree', e.target.value)}
                    className="font-bold text-base border-none focus-visible:ring-0 px-0"
                  />
                  <Input
                    value={item.school}
                    onChange={(e) => handleUpdateItem(index, 'school', e.target.value)}
                    className="text-sm border-none focus-visible:ring-0 px-0"
                  />
                </>
              ) : (
                <>
                  <h3 className="font-bold text-base">{item.degree}</h3>
                  <p className="text-sm">{item.school}</p>
                </>
              )}
            </div>
            <div className="text-right text-sm">
              {isEditable ? (
                <Input
                  value={item.graduationYear}
                  onChange={(e) => handleUpdateItem(index, 'graduationYear', e.target.value)}
                  className="text-right border-none focus-visible:ring-0 px-0"
                />
              ) : (
                <p>{item.graduationYear}</p>
              )}
            </div>
          </div>
          {(item.gpa || item.honors) && (
            <div className="text-sm">
              {isEditable ? (
                <div className="flex gap-2">
                  {item.gpa && (
                    <Input
                      value={item.gpa}
                      onChange={(e) => handleUpdateItem(index, 'gpa', e.target.value)}
                      placeholder="GPA: 3.8"
                      className="border-none focus-visible:ring-0 px-0"
                    />
                  )}
                  {item.honors && (
                    <Input
                      value={item.honors}
                      onChange={(e) => handleUpdateItem(index, 'honors', e.target.value)}
                      placeholder="Honors"
                      className="border-none focus-visible:ring-0 px-0"
                    />
                  )}
                </div>
              ) : (
                <p>
                  {item.gpa && `GPA: ${item.gpa}`}
                  {item.gpa && item.honors && ' | '}
                  {item.honors}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
      {isEditable && (
        <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Education
        </Button>
      )}
    </div>
  );
}

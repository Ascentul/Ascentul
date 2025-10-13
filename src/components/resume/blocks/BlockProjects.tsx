'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BlockProjectsProps {
  data: {
    items?: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockProjects({ data, isSelected, isEditable, onChange }: BlockProjectsProps) {
  const items = data.items || [];

  const handleAddItem = () => {
    onChange({
      items: [
        ...items,
        {
          name: 'Project Name',
          description: 'Project description',
          technologies: ['Tech1', 'Tech2'],
          url: '',
        },
      ],
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">PROJECTS</h2>
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          {isEditable ? (
            <>
              <Input
                value={item.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                className="font-bold text-base border-none focus-visible:ring-0 px-0"
              />
              <Textarea
                value={item.description}
                onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                className="text-sm min-h-[60px] resize-none border-none focus-visible:ring-0 px-0"
              />
              <Input
                value={item.technologies.join(', ')}
                onChange={(e) =>
                  handleUpdateItem(
                    index,
                    'technologies',
                    e.target.value.split(',').map((t) => t.trim())
                  )
                }
                placeholder="Technologies (comma-separated)"
                className="text-sm border-none focus-visible:ring-0 px-0"
              />
              {item.url && (
                <Input
                  value={item.url}
                  onChange={(e) => handleUpdateItem(index, 'url', e.target.value)}
                  placeholder="Project URL"
                  className="text-sm border-none focus-visible:ring-0 px-0"
                />
              )}
            </>
          ) : (
            <>
              <h3 className="font-bold text-base">{item.name}</h3>
              <p className="text-sm">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                Technologies: {item.technologies.join(', ')}
              </p>
              {item.url && (
                <p className="text-sm text-primary underline">{item.url}</p>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Project
        </Button>
      )}
    </div>
  );
}

'use client';

import { Plus, X } from 'lucide-react';
import type { ProjectsBlockData, ProjectItem } from '@/lib/validators/resume';

interface ProjectsBlockProps {
  data: ProjectsBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: ProjectsBlockData) => void;
  onClick?: () => void;
}

export function ProjectsBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: ProjectsBlockProps) {
  const handleItemChange = (index: number, field: keyof ProjectItem, value: any) => {
    if (readOnly) return;

    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onDataChange?.({ items: newItems });
  };

  const handleBulletChange = (itemIndex: number, bulletIndex: number, value: string) => {
    if (readOnly) return;

    const newItems = [...data.items];
    const bullets = newItems[itemIndex].bullets || [];
    const newBullets = [...bullets];
    newBullets[bulletIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], bullets: newBullets };
    onDataChange?.({ items: newItems });
  };

  const addBullet = (itemIndex: number) => {
    const newItems = [...data.items];
    const bullets = newItems[itemIndex].bullets || [];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      bullets: [...bullets, ''],
    };
    onDataChange?.({ items: newItems });
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    const newItems = [...data.items];
    const bullets = newItems[itemIndex].bullets || [];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      bullets: bullets.filter((_, i) => i !== bulletIndex),
    };
    onDataChange?.({ items: newItems });
  };

  const addItem = () => {
    onDataChange?.({
      items: [
        ...data.items,
        {
          name: '',
          description: '',
          bullets: [],
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    onDataChange?.({
      items: data.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Projects
      </h2>

      <div className="space-y-5">
        {data.items.map((item, itemIndex) => (
          <div key={itemIndex} className="relative group">
            {/* Remove button */}
            {!readOnly && (
              <button
                onClick={() => removeItem(itemIndex)}
                className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Project Name */}
            {readOnly ? (
              <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
            ) : (
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemChange(itemIndex, 'name', e.target.value)}
                className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 w-full"
                placeholder="Project Name"
              />
            )}

            {/* Description */}
            <div className="mt-1">
              {readOnly ? (
                <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
              ) : (
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(itemIndex, 'description', e.target.value)
                  }
                  className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 resize-none"
                  placeholder="Brief description of the project..."
                  rows={2}
                />
              )}
            </div>

            {/* Bullets */}
            {((item.bullets && item.bullets.length > 0) || !readOnly) && (
              <ul className="mt-2 space-y-1">
                {item.bullets?.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-2 group/bullet">
                    <span className="text-gray-600 text-sm mt-0.5">•</span>
                    {readOnly ? (
                      <p className="text-sm text-gray-700">{bullet}</p>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) =>
                            handleBulletChange(itemIndex, bulletIndex, e.target.value)
                          }
                          className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                          placeholder="Key achievement or technical detail..."
                        />
                        <button
                          onClick={() => removeBullet(itemIndex, bulletIndex)}
                          className="opacity-0 group-hover/bullet:opacity-100 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}

                {!readOnly && (
                  <button
                    onClick={() => addBullet(itemIndex)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 ml-4"
                  >
                    <Plus className="w-4 h-4" />
                    Add bullet
                  </button>
                )}
              </ul>
            )}
          </div>
        ))}

        {!readOnly && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-4"
          >
            <Plus className="w-4 h-4" />
            Add project
          </button>
        )}
      </div>
    </div>
  );
}

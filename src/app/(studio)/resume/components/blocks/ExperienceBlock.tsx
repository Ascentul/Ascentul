'use client';

import { Plus, X } from 'lucide-react';
import type { ExperienceBlockData, ExperienceItem } from '@/lib/validators/resume';

interface ExperienceBlockProps {
  data: ExperienceBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: ExperienceBlockData) => void;
  onClick?: () => void;
}

export function ExperienceBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: ExperienceBlockProps) {
  const handleItemChange = (index: number, field: keyof ExperienceItem, value: any) => {
    if (readOnly) return;

    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onDataChange?.({ items: newItems });
  };

  const handleBulletChange = (itemIndex: number, bulletIndex: number, value: string) => {
    if (readOnly) return;

    const newItems = [...data.items];
    const newBullets = [...newItems[itemIndex].bullets];
    newBullets[bulletIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], bullets: newBullets };
    onDataChange?.({ items: newItems });
  };

  const addBullet = (itemIndex: number) => {
    const newItems = [...data.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      bullets: [...newItems[itemIndex].bullets, ''],
    };
    onDataChange?.({ items: newItems });
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    const newItems = [...data.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      bullets: newItems[itemIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
    onDataChange?.({ items: newItems });
  };

  const addItem = () => {
    onDataChange?.({
      items: [
        ...data.items,
        {
          company: '',
          role: '',
          start: '',
          end: 'Present',
          bullets: [''],
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
        Experience
      </h2>

      <div className="space-y-6">
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

            {/* Role */}
            <div className="flex items-baseline justify-between gap-4">
              {readOnly ? (
                <h3 className="text-base font-semibold text-gray-900">{item.role}</h3>
              ) : (
                <input
                  type="text"
                  value={item.role}
                  onChange={(e) => handleItemChange(itemIndex, 'role', e.target.value)}
                  className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 flex-1"
                  placeholder="Job Title"
                />
              )}

              {/* Dates */}
              <div className="text-sm text-gray-600 whitespace-nowrap">
                {readOnly ? (
                  <span>
                    {item.start} - {item.end}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.start}
                      onChange={(e) => handleItemChange(itemIndex, 'start', e.target.value)}
                      className="w-24 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 text-right"
                      placeholder="Jan 2020"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={item.end}
                      onChange={(e) => handleItemChange(itemIndex, 'end', e.target.value)}
                      className="w-24 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                      placeholder="Present"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Company */}
            <div className="mt-1">
              {readOnly ? (
                <p className="text-sm text-gray-600">{item.company}</p>
              ) : (
                <input
                  type="text"
                  value={item.company}
                  onChange={(e) => handleItemChange(itemIndex, 'company', e.target.value)}
                  className="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 w-full"
                  placeholder="Company Name"
                />
              )}
            </div>

            {/* Bullets */}
            <ul className="mt-3 space-y-2">
              {item.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} className="flex items-start gap-2 group/bullet">
                  <span className="text-gray-600 mt-1.5">•</span>
                  {readOnly ? (
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">
                      {bullet}
                    </p>
                  ) : (
                    <>
                      <textarea
                        value={bullet}
                        onChange={(e) =>
                          handleBulletChange(itemIndex, bulletIndex, e.target.value)
                        }
                        className="flex-1 text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 resize-none"
                        placeholder="Describe your achievement with metrics..."
                        rows={2}
                      />
                      <button
                        onClick={() => removeBullet(itemIndex, bulletIndex)}
                        className="opacity-0 group-hover/bullet:opacity-100 text-red-500 hover:text-red-700 mt-1"
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
          </div>
        ))}

        {!readOnly && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-4"
          >
            <Plus className="w-4 h-4" />
            Add position
          </button>
        )}
      </div>
    </div>
  );
}

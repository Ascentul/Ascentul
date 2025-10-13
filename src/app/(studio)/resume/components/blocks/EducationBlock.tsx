'use client';

import { Plus, X } from 'lucide-react';
import type { EducationBlockData, EducationItem } from '@/lib/validators/resume';

interface EducationBlockProps {
  data: EducationBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: EducationBlockData) => void;
  onClick?: () => void;
}

export function EducationBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: EducationBlockProps) {
  const handleItemChange = (index: number, field: keyof EducationItem, value: any) => {
    if (readOnly) return;

    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onDataChange?.({ items: newItems });
  };

  const handleDetailChange = (itemIndex: number, detailIndex: number, value: string) => {
    if (readOnly) return;

    const newItems = [...data.items];
    const details = newItems[itemIndex].details || [];
    const newDetails = [...details];
    newDetails[detailIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], details: newDetails };
    onDataChange?.({ items: newItems });
  };

  const addDetail = (itemIndex: number) => {
    const newItems = [...data.items];
    const details = newItems[itemIndex].details || [];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      details: [...details, ''],
    };
    onDataChange?.({ items: newItems });
  };

  const removeDetail = (itemIndex: number, detailIndex: number) => {
    const newItems = [...data.items];
    const details = newItems[itemIndex].details || [];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      details: details.filter((_, i) => i !== detailIndex),
    };
    onDataChange?.({ items: newItems });
  };

  const addItem = () => {
    onDataChange?.({
      items: [
        ...data.items,
        {
          school: '',
          degree: '',
          end: '',
          details: [],
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
        Education
      </h2>

      <div className="space-y-4">
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

            {/* Degree and Date */}
            <div className="flex items-baseline justify-between gap-4">
              {readOnly ? (
                <h3 className="text-base font-semibold text-gray-900">{item.degree}</h3>
              ) : (
                <input
                  type="text"
                  value={item.degree}
                  onChange={(e) => handleItemChange(itemIndex, 'degree', e.target.value)}
                  className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 flex-1"
                  placeholder="Bachelor of Science in Computer Science"
                />
              )}

              <div className="text-sm text-gray-600 whitespace-nowrap">
                {readOnly ? (
                  <span>{item.end}</span>
                ) : (
                  <input
                    type="text"
                    value={item.end}
                    onChange={(e) => handleItemChange(itemIndex, 'end', e.target.value)}
                    className="w-24 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 text-right"
                    placeholder="May 2024"
                  />
                )}
              </div>
            </div>

            {/* School */}
            <div className="mt-1">
              {readOnly ? (
                <p className="text-sm text-gray-600">{item.school}</p>
              ) : (
                <input
                  type="text"
                  value={item.school}
                  onChange={(e) => handleItemChange(itemIndex, 'school', e.target.value)}
                  className="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 w-full"
                  placeholder="University Name"
                />
              )}
            </div>

            {/* Details */}
            {((item.details && item.details.length > 0) || !readOnly) && (
              <ul className="mt-2 space-y-1">
                {item.details?.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start gap-2 group/detail">
                    <span className="text-gray-600 text-sm mt-0.5">•</span>
                    {readOnly ? (
                      <p className="text-sm text-gray-700">{detail}</p>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) =>
                            handleDetailChange(itemIndex, detailIndex, e.target.value)
                          }
                          className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                          placeholder="GPA: 3.8/4.0 or Honors"
                        />
                        <button
                          onClick={() => removeDetail(itemIndex, detailIndex)}
                          className="opacity-0 group-hover/detail:opacity-100 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}

                {!readOnly && (
                  <button
                    onClick={() => addDetail(itemIndex)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 ml-4"
                  >
                    <Plus className="w-4 h-4" />
                    Add detail
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
            Add education
          </button>
        )}
      </div>
    </div>
  );
}

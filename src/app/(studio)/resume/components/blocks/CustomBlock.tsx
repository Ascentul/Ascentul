'use client';

import { Plus, X } from 'lucide-react';
import type { CustomBlockData } from '@/lib/validators/resume';

interface CustomBlockProps {
  data: CustomBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: CustomBlockData) => void;
  onClick?: () => void;
}

export function CustomBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: CustomBlockProps) {
  const handleBulletChange = (index: number, value: string) => {
    if (readOnly) return;

    const newBullets = [...data.bullets];
    newBullets[index] = value;
    onDataChange?.({ ...data, bullets: newBullets });
  };

  const addBullet = () => {
    onDataChange?.({
      ...data,
      bullets: [...data.bullets, ''],
    });
  };

  const removeBullet = (index: number) => {
    onDataChange?.({
      ...data,
      bullets: data.bullets.filter((_, i) => i !== index),
    });
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {/* Heading */}
      {readOnly ? (
        <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          {data.heading}
        </h2>
      ) : (
        <input
          type="text"
          value={data.heading}
          onChange={(e) => onDataChange?.({ ...data, heading: e.target.value })}
          className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 w-full mb-4 uppercase tracking-wide"
          placeholder="Section Heading"
        />
      )}

      {/* Bullets */}
      <ul className="space-y-2">
        {data.bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2 group">
            <span className="text-gray-600 mt-0.5">•</span>
            {readOnly ? (
              <p className="text-sm text-gray-700 leading-relaxed flex-1">{bullet}</p>
            ) : (
              <>
                <textarea
                  value={bullet}
                  onChange={(e) => handleBulletChange(index, e.target.value)}
                  className="flex-1 text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 resize-none"
                  placeholder="Content for this section..."
                  rows={2}
                />
                <button
                  onClick={() => removeBullet(index)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}

        {!readOnly && (
          <button
            onClick={addBullet}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 ml-4"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        )}
      </ul>
    </div>
  );
}

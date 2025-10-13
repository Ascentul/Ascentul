'use client';

import type { SummaryBlockData } from '@/lib/validators/resume';

interface SummaryBlockProps {
  data: SummaryBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: SummaryBlockData) => void;
  onClick?: () => void;
}

export function SummaryBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: SummaryBlockProps) {
  const handleChange = (value: string) => {
    if (readOnly) return;
    onDataChange?.({ paragraph: value });
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-3 uppercase tracking-wide">
        Professional Summary
      </h2>

      {readOnly ? (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {data.paragraph}
        </p>
      ) : (
        <textarea
          value={data.paragraph}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded p-2 text-gray-700 leading-relaxed resize-none"
          placeholder="Write a compelling professional summary highlighting your key qualifications and value proposition..."
          rows={4}
        />
      )}
    </div>
  );
}

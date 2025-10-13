'use client';

import { Textarea } from '@/components/ui/textarea';

interface BlockSummaryProps {
  data: {
    text?: string;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockSummary({ data, isSelected, isEditable, onChange }: BlockSummaryProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">
        PROFESSIONAL SUMMARY
      </h2>
      {isEditable ? (
        <Textarea
          value={data.text || ''}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Write a compelling professional summary..."
          className="min-h-[80px] resize-none border-none focus-visible:ring-0 px-0"
        />
      ) : (
        <p className="text-sm leading-relaxed">{data.text}</p>
      )}
    </div>
  );
}

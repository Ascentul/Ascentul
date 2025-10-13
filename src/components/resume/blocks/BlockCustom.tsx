'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BlockCustomProps {
  data: {
    title?: string;
    content?: string;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockCustom({ data, isSelected, isEditable, onChange }: BlockCustomProps) {
  return (
    <div className="space-y-2">
      {isEditable ? (
        <>
          <Input
            value={data.title || 'CUSTOM SECTION'}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="text-xl font-bold border-none focus-visible:ring-0 px-0 uppercase"
          />
          <div className="border-b-2 border-foreground" />
          <Textarea
            value={data.content || ''}
            onChange={(e) => onChange({ ...data, content: e.target.value })}
            placeholder="Enter custom content..."
            className="text-sm min-h-[100px] resize-none border-none focus-visible:ring-0 px-0"
          />
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold border-b-2 border-foreground pb-1">
            {data.title || 'CUSTOM SECTION'}
          </h2>
          <p className="text-sm whitespace-pre-wrap">{data.content}</p>
        </>
      )}
    </div>
  );
}

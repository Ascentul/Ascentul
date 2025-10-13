'use client';

import { Input } from '@/components/ui/input';

interface BlockHeaderProps {
  data: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  isSelected: boolean;
  isEditable: boolean;
  onChange: (data: any) => void;
}

export function BlockHeader({ data, isSelected, isEditable, onChange }: BlockHeaderProps) {
  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="text-center space-y-2 py-4">
      {isEditable ? (
        <>
          <Input
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your Name"
            className="text-3xl font-bold text-center border-none focus-visible:ring-0 px-0"
          />
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Input
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              className="w-auto inline-block border-none focus-visible:ring-0 px-1"
            />
            <span className="text-muted-foreground">|</span>
            <Input
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-auto inline-block border-none focus-visible:ring-0 px-1"
            />
            <span className="text-muted-foreground">|</span>
            <Input
              value={data.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, State"
              className="w-auto inline-block border-none focus-visible:ring-0 px-1"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            {data.linkedin && (
              <Input
                value={data.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/username"
                className="w-auto inline-block border-none focus-visible:ring-0 px-1"
              />
            )}
            {data.github && (
              <Input
                value={data.github}
                onChange={(e) => handleChange('github', e.target.value)}
                placeholder="github.com/username"
                className="w-auto inline-block border-none focus-visible:ring-0 px-1"
              />
            )}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>| {data.phone}</span>}
            {data.location && <span>| {data.location}</span>}
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            {data.linkedin && <span>{data.linkedin}</span>}
            {data.github && <span>| {data.github}</span>}
          </div>
        </>
      )}
    </div>
  );
}

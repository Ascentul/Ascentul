'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type {
  Block,
  HeaderData,
  SummaryData,
  ExperienceData,
  EducationData,
  SkillsData,
  ProjectsData,
  CustomData,
} from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';

interface BlockInspectorProps {
  block: Block | null;
  clerkId: string;
  resumeUpdatedAt: number;
  onUpdate: (newResumeUpdatedAt: number) => void;
}

export function BlockInspector({ block, clerkId, resumeUpdatedAt, onUpdate }: BlockInspectorProps) {
  const [localData, setLocalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const updateBlock = useMutation(api.builder_blocks.update);

  // Sync local data when block changes
  useEffect(() => {
    if (block) {
      setLocalData(JSON.parse(JSON.stringify(block.data)));
    } else {
      setLocalData(null);
    }
  }, [block?._id]);

  const handleChange = useCallback(
    (newData: any) => {
      setLocalData(newData);

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        if (!block) return;

        setIsSaving(true);
        try {
          const result = await updateBlock({
            id: block._id,
            clerkId,
            data: newData,
            expectedResumeUpdatedAt: resumeUpdatedAt,
          });

          onUpdate(result.resumeUpdatedAt);

          // Show "Saved" briefly
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
        } catch (error) {
          console.error('Failed to update block:', error);
        } finally {
          setIsSaving(false);
        }
      }, 400);

      setDebounceTimer(timer);
    },
    [block, clerkId, resumeUpdatedAt, updateBlock, debounceTimer, onUpdate]
  );

  if (!block || !localData) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground text-center py-8">
          Select a block to edit
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Inspector</h3>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {block.type === 'header' && (
        <HeaderInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'summary' && (
        <SummaryInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'experience' && (
        <ExperienceInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'education' && (
        <EducationInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'skills' && (
        <SkillsInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'projects' && (
        <ProjectsInspector data={localData} onChange={handleChange} />
      )}
      {block.type === 'custom' && (
        <CustomInspector data={localData} onChange={handleChange} />
      )}
    </div>
  );
}

// Header Inspector
function HeaderInspector({ data, onChange }: { data: HeaderData; onChange: (data: HeaderData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName" className="text-xs">Full Name</Label>
        <Input
          id="fullName"
          value={data.fullName || ''}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          placeholder="John Doe"
        />
      </div>
      <div>
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Software Engineer"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input
          id="email"
          type="email"
          value={data.contact?.email || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, email: e.target.value },
            })
          }
          placeholder="john@example.com"
        />
      </div>
      <div>
        <Label htmlFor="phone" className="text-xs">Phone</Label>
        <Input
          id="phone"
          value={data.contact?.phone || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, phone: e.target.value },
            })
          }
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="location" className="text-xs">Location</Label>
        <Input
          id="location"
          value={data.contact?.location || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, location: e.target.value },
            })
          }
          placeholder="San Francisco, CA"
        />
      </div>
      <div>
        <Label htmlFor="links" className="text-xs">Links (comma separated)</Label>
        <Input
          id="links"
          value={data.contact?.links?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: {
                ...data.contact,
                links: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              },
            })
          }
          placeholder="linkedin.com/in/johndoe, github.com/johndoe"
        />
      </div>
    </div>
  );
}

// Summary Inspector
function SummaryInspector({ data, onChange }: { data: SummaryData; onChange: (data: SummaryData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="paragraph" className="text-xs">Summary</Label>
        <Textarea
          id="paragraph"
          value={data.paragraph || ''}
          onChange={(e) => onChange({ ...data, paragraph: e.target.value })}
          placeholder="Write a professional summary..."
          rows={6}
        />
      </div>
    </div>
  );
}

// Experience Inspector
function ExperienceInspector({ data, onChange }: { data: ExperienceData; onChange: (data: ExperienceData) => void }) {
  const items = data.items || [];

  const addItem = () => {
    onChange({
      ...data,
      items: [
        ...items,
        { company: '', role: '', location: '', start: '', end: '', bullets: [''] },
      ],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...data, items: newItems });
  };

  const addBullet = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].bullets.push('');
    onChange({ ...data, items: newItems });
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].bullets = newItems[itemIndex].bullets.filter((_, i) => i !== bulletIndex);
    onChange({ ...data, items: newItems });
  };

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    const newItems = [...items];
    newItems[itemIndex].bullets[bulletIndex] = value;
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Position {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.company}
            onChange={(e) => updateItem(index, { company: e.target.value })}
            placeholder="Company"
            className="text-sm"
          />
          <Input
            value={item.role}
            onChange={(e) => updateItem(index, { role: e.target.value })}
            placeholder="Role"
            className="text-sm"
          />
          <Input
            value={item.location || ''}
            onChange={(e) => updateItem(index, { location: e.target.value })}
            placeholder="Location (optional)"
            className="text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={item.start}
              onChange={(e) => updateItem(index, { start: e.target.value })}
              placeholder="Start (e.g., Jan 2020)"
              className="text-sm"
            />
            <Input
              value={item.end}
              onChange={(e) => updateItem(index, { end: e.target.value })}
              placeholder="End (e.g., Present)"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bullets</Label>
            {item.bullets.map((bullet, bIndex) => (
              <div key={bIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                  placeholder="Achievement or responsibility..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBullet(index, bIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBullet(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Bullet
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}

// Education Inspector
function EducationInspector({ data, onChange }: { data: EducationData; onChange: (data: EducationData) => void }) {
  const items = data.items || [];

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { school: '', degree: '', location: '', end: '', details: [''] }],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...data, items: newItems });
  };

  const addDetail = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].details.push('');
    onChange({ ...data, items: newItems });
  };

  const removeDetail = (itemIndex: number, detailIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].details = newItems[itemIndex].details.filter((_, i) => i !== detailIndex);
    onChange({ ...data, items: newItems });
  };

  const updateDetail = (itemIndex: number, detailIndex: number, value: string) => {
    const newItems = [...items];
    newItems[itemIndex].details[detailIndex] = value;
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Education {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.school}
            onChange={(e) => updateItem(index, { school: e.target.value })}
            placeholder="School"
            className="text-sm"
          />
          <Input
            value={item.degree}
            onChange={(e) => updateItem(index, { degree: e.target.value })}
            placeholder="Degree"
            className="text-sm"
          />
          <Input
            value={item.location || ''}
            onChange={(e) => updateItem(index, { location: e.target.value })}
            placeholder="Location (optional)"
            className="text-sm"
          />
          <Input
            value={item.end}
            onChange={(e) => updateItem(index, { end: e.target.value })}
            placeholder="Graduation Date (e.g., May 2020)"
            className="text-sm"
          />
          <div className="space-y-2">
            <Label className="text-xs">Details</Label>
            {item.details.map((detail, dIndex) => (
              <div key={dIndex} className="flex gap-2">
                <Input
                  value={detail}
                  onChange={(e) => updateDetail(index, dIndex, e.target.value)}
                  placeholder="GPA, honors, relevant coursework..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDetail(index, dIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDetail(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Detail
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

// Skills Inspector
function SkillsInspector({ data, onChange }: { data: SkillsData; onChange: (data: SkillsData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="primary" className="text-xs">Primary Skills (comma separated)</Label>
        <Textarea
          id="primary"
          value={data.primary?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...data,
              primary: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="JavaScript, TypeScript, React, Node.js"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="secondary" className="text-xs">Secondary Skills (comma separated)</Label>
        <Textarea
          id="secondary"
          value={data.secondary?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...data,
              secondary: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Git, Docker, AWS, PostgreSQL"
          rows={3}
        />
      </div>
    </div>
  );
}

// Projects Inspector
function ProjectsInspector({ data, onChange }: { data: ProjectsData; onChange: (data: ProjectsData) => void }) {
  const items = data.items || [];

  const addItem = () => {
    onChange({
      ...data,
      items: [...items, { name: '', description: '', bullets: [''] }],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...data, items: newItems });
  };

  const addBullet = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].bullets.push('');
    onChange({ ...data, items: newItems });
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].bullets = newItems[itemIndex].bullets.filter((_, i) => i !== bulletIndex);
    onChange({ ...data, items: newItems });
  };

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    const newItems = [...items];
    newItems[itemIndex].bullets[bulletIndex] = value;
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Project {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.name}
            onChange={(e) => updateItem(index, { name: e.target.value })}
            placeholder="Project Name"
            className="text-sm"
          />
          <Textarea
            value={item.description}
            onChange={(e) => updateItem(index, { description: e.target.value })}
            placeholder="Brief description"
            className="text-sm"
            rows={2}
          />
          <div className="space-y-2">
            <Label className="text-xs">Highlights</Label>
            {item.bullets.map((bullet, bIndex) => (
              <div key={bIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                  placeholder="Key feature or achievement..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBullet(index, bIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBullet(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Highlight
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}

// Custom Inspector
function CustomInspector({ data, onChange }: { data: CustomData; onChange: (data: CustomData) => void }) {
  const bullets = data.bullets || [];

  const addBullet = () => {
    onChange({ ...data, bullets: [...bullets, ''] });
  };

  const removeBullet = (index: number) => {
    onChange({
      ...data,
      bullets: bullets.filter((_, i) => i !== index),
    });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    onChange({ ...data, bullets: newBullets });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="heading" className="text-xs">Section Heading</Label>
        <Input
          id="heading"
          value={data.heading || ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
          placeholder="e.g., Certifications, Awards"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Items</Label>
        {bullets.map((bullet, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              placeholder="Item..."
              className="text-sm flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeBullet(index)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addBullet}
          className="w-full text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
